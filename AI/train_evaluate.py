from pathlib import Path
import gc
import hashlib
import time

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sentence_transformers import SentenceTransformer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import GroupShuffleSplit

try:
    from .hybrid_classifier import (
        SEMANTIC_MODEL_NAME,
        TEXT_WEIGHT,
        SEMANTIC_WEIGHT,
        blend_probabilities,
        build_semantic_classifier,
        build_text_classifier,
    )
except ImportError:
    from hybrid_classifier import (
        SEMANTIC_MODEL_NAME,
        TEXT_WEIGHT,
        SEMANTIC_WEIGHT,
        blend_probabilities,
        build_semantic_classifier,
        build_text_classifier,
    )


BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "docs" / "hourlink_skill_dataset_v3.csv"
EVALUATION_SPLITS = 5


def embedding_cache_path() -> Path:
    dataset_hash = hashlib.sha256(DATASET_PATH.read_bytes()).hexdigest()[:16]
    return Path('/tmp') / f'hourlink-v3-embeddings-{dataset_hash}.npy'


def train_and_evaluate():
    print(f"1. Đang đọc dữ liệu từ: {DATASET_PATH} ...")
    try:
        df = pd.read_csv(DATASET_PATH)
    except FileNotFoundError:
        print("Lỗi: Không tìm thấy file dữ liệu!")
        return

    df = df.dropna(subset=['description', 'category_id', 'category_name', 'skill_name'])
    texts = df['description'].astype(str)
    labels = df['category_id'].astype(int).to_numpy()
    groups = df['group_id'] if 'group_id' in df.columns else df['skill_name']
    category_ids = sorted(df['category_id'].unique())
    category_names_by_id = (
        df[['category_id', 'category_name']]
        .drop_duplicates()
        .set_index('category_id')['category_name']
        .to_dict()
    )
    target_names = [category_names_by_id[category_id] for category_id in category_ids]
    print(f"Tổng số dòng dữ liệu: {len(df)}")

    cache_path = embedding_cache_path()
    if cache_path.exists():
        print(f"\n2. Đang dùng embedding cache: {cache_path}")
        embeddings = np.load(cache_path)
    else:
        print(f"\n2. Đang mã hóa ngữ nghĩa bằng {SEMANTIC_MODEL_NAME} ...")
        semantic_encoder = SentenceTransformer(SEMANTIC_MODEL_NAME)
        embeddings = semantic_encoder.encode(
            texts.tolist(),
            batch_size=16,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        embeddings = np.asarray(embeddings, dtype=np.float32)
        np.save(cache_path, embeddings)
        print(f"   Đã lưu embedding cache: {cache_path}")
        # The final artifact stores only the Logistic Regression head and the
        # sentence-model name. Releasing the encoder avoids retaining PyTorch
        # memory while the classifiers are evaluated.
        del semantic_encoder
        gc.collect()

    print(f"\n3. Đánh giá {EVALUATION_SPLITS} lần theo nhóm kỹ năng/chủ đề chưa từng thấy...")
    splitter = GroupShuffleSplit(
        n_splits=EVALUATION_SPLITS, test_size=0.2, random_state=42
    )
    text_scores = []
    semantic_scores = []
    hybrid_scores = []
    all_expected = []
    all_hybrid_predictions = []
    evaluation_started = time.time()

    for split_number, (train_indices, test_indices) in enumerate(
        splitter.split(texts, labels, groups=groups), start=1
    ):
        text_model = build_text_classifier()
        text_model.fit(texts.iloc[train_indices], labels[train_indices])
        text_probabilities = text_model.predict_proba(texts.iloc[test_indices])

        semantic_classifier = build_semantic_classifier()
        semantic_classifier.fit(embeddings[train_indices], labels[train_indices])
        semantic_probabilities = semantic_classifier.predict_proba(embeddings[test_indices])

        hybrid_classes, hybrid_probabilities = blend_probabilities(
            text_model.classes_,
            text_probabilities,
            semantic_classifier.classes_,
            semantic_probabilities,
        )
        text_predictions = text_model.classes_[np.argmax(text_probabilities, axis=1)]
        semantic_predictions = semantic_classifier.classes_[np.argmax(semantic_probabilities, axis=1)]
        hybrid_predictions = hybrid_classes[np.argmax(hybrid_probabilities, axis=1)]
        expected = labels[test_indices]

        text_accuracy = accuracy_score(expected, text_predictions)
        semantic_accuracy = accuracy_score(expected, semantic_predictions)
        hybrid_accuracy = accuracy_score(expected, hybrid_predictions)
        text_scores.append(text_accuracy)
        semantic_scores.append(semantic_accuracy)
        hybrid_scores.append(hybrid_accuracy)
        all_expected.append(expected)
        all_hybrid_predictions.append(hybrid_predictions)

        print(
            f"   Split {split_number}: TF-IDF={text_accuracy * 100:.2f}% | "
            f"Semantic={semantic_accuracy * 100:.2f}% | Hybrid={hybrid_accuracy * 100:.2f}%"
        )

        # Five independent text vectorizers can otherwise retain sizeable
        # sparse vocabularies until process exit on macOS.  Release each split
        # explicitly so the evaluation remains stable on a development laptop.
        del text_model, semantic_classifier
        del text_probabilities, semantic_probabilities, hybrid_probabilities
        gc.collect()

    text_mean = float(np.mean(text_scores))
    semantic_mean = float(np.mean(semantic_scores))
    hybrid_mean = float(np.mean(hybrid_scores))
    print(f"   Hoàn tất trong {time.time() - evaluation_started:.2f} giây")
    print(f"\n4. KẾT QUẢ TRUNG BÌNH:")
    print(f"   - TF-IDF + Logistic Regression: {text_mean * 100:.2f}%")
    print(f"   - SentenceTransformer + Logistic Regression: {semantic_mean * 100:.2f}%")
    print(
        f"   - Hybrid ({TEXT_WEIGHT:.0%} text + {SEMANTIC_WEIGHT:.0%} semantic): "
        f"{hybrid_mean * 100:.2f}%"
    )

    expected_all = np.concatenate(all_expected)
    hybrid_predictions_all = np.concatenate(all_hybrid_predictions)
    report_text = classification_report(
        expected_all,
        hybrid_predictions_all,
        labels=category_ids,
        target_names=target_names,
        zero_division=0,
    )
    report_header = (
        "HourLink Hybrid Category Classifier — 5 group holdout splits\n"
        f"TF-IDF mean accuracy: {text_mean:.4f}\n"
        f"Semantic mean accuracy: {semantic_mean:.4f}\n"
        f"Hybrid mean accuracy: {hybrid_mean:.4f}\n"
        f"Weights: text={TEXT_WEIGHT:.2f}, semantic={SEMANTIC_WEIGHT:.2f}\n\n"
    )
    print("\n5. BÁO CÁO PHÂN LOẠI HYBRID:")
    print(report_text)
    (BASE_DIR / "classification_report.txt").write_text(
        report_header + report_text, encoding="utf-8"
    )

    print("\n6. Đang vẽ Confusion Matrix tổng hợp...")
    matrix = confusion_matrix(
        expected_all, hybrid_predictions_all, labels=category_ids
    )
    plt.figure(figsize=(12, 10))
    sns.heatmap(
        matrix,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=target_names,
        yticklabels=target_names,
    )
    plt.title('Ma trận nhầm lẫn — Hybrid TF-IDF + SentenceTransformer + LR')
    plt.xlabel('AI dự đoán')
    plt.ylabel('Thực tế')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig(BASE_DIR / 'confusion_matrix.png', dpi=300)
    plt.close()

    print("\n7. Đang huấn luyện mô hình cuối trên toàn bộ dataset...")
    final_text_model = build_text_classifier()
    final_text_model.fit(texts, labels)
    final_semantic_classifier = build_semantic_classifier()
    final_semantic_classifier.fit(embeddings, labels)
    model_bundle = {
        'version': 3,
        'type': 'hybrid_tfidf_sentence_transformer_logistic_regression',
        'semantic_model_name': SEMANTIC_MODEL_NAME,
        'text_weight': TEXT_WEIGHT,
        'semantic_weight': SEMANTIC_WEIGHT,
        'text_classifier': final_text_model,
        'semantic_classifier': final_semantic_classifier,
        'category_mapping': category_names_by_id,
        # Reuse the exact normalized vectors for nearest-example suggestions.
        # This avoids re-encoding all 6,400 rows every time the API starts.
        'dataset_embeddings': embeddings,
        'dataset_size': len(df),
    }
    model_path = BASE_DIR / 'model_category.pkl'
    joblib.dump(model_bundle, model_path)
    print(f"   ✅ Đã lưu hybrid model bundle tại '{model_path}'")


if __name__ == "__main__":
    train_and_evaluate()

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

import numpy as np
from sentence_transformers import SentenceTransformer, util

try:
    from .hybrid_classifier import (
        SEMANTIC_MODEL_NAME,
        SEMANTIC_WEIGHT,
        TEXT_WEIGHT,
        blend_probabilities,
        build_semantic_classifier,
        build_text_classifier,
    )
except ImportError:  # Chạy `uvicorn main:app` trực tiếp trong thư mục AI
    from hybrid_classifier import (
        SEMANTIC_MODEL_NAME,
        SEMANTIC_WEIGHT,
        TEXT_WEIGHT,
        blend_probabilities,
        build_semantic_classifier,
        build_text_classifier,
    )

app = FastAPI(title="HourLink AI Matching API")

# -----------------
# 1. MODELS (DTOs)
# -----------------
class PredictCategoryRequest(BaseModel):
    description: str

class PredictCategoryResponse(BaseModel):
    category_id: int
    category_name: str
    confidence: float
    suggested_title: Optional[str] = ""
    suggested_level: Optional[str] = ""
    suggested_format: Optional[str] = ""
    suggested_time: Optional[str] = ""

class HelperSkill(BaseModel):
    user_id: str
    skill_id: str
    skill_name: Optional[str] = ""
    skill_description: Optional[str] = ""
    free_time: Optional[str] = ""
    reputation_score: float

class RecommendRequest(BaseModel):
    help_request_id: str
    description: Optional[str] = ""
    desired_time: Optional[str] = ""
    helpers: List[HelperSkill]

class Recommendation(BaseModel):
    user_id: str
    skill_id: str
    match_percentage: int
    reasons: List[str]

class RecommendResponse(BaseModel):
    recommendations: List[Recommendation]

# -----------------
# 2. ML MODELS STATE
# -----------------
model_category = None
model_semantic: SentenceTransformer = None
model_semantic_classifier = None
model_text_weight = TEXT_WEIGHT
model_semantic_weight = SEMANTIC_WEIGHT
dataset_df = None
dataset_embeddings = None

import joblib
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "docs" / "hourlink_skill_dataset_v3.csv"
MODEL_PATH = BASE_DIR / "model_category.pkl"

# Danh mục kỹ năng giả định (Mock Data vì chưa có CSDL thật)
CATEGORY_MAPPING = {
    1: (1, "Lập trình"),
    2: (2, "Ngôn ngữ"),
    3: (3, "Thiết kế"),
    4: (4, "Kinh doanh"),
    5: (5, "Giáo dục"),
    6: (6, "Sức khỏe"),
    7: (7, "Nghệ thuật"),
    8: (8, "Khác"),
}

@app.on_event("startup")
def load_models():
    global model_category, model_semantic, model_semantic_classifier
    global model_text_weight, model_semantic_weight
    global CATEGORY_MAPPING, dataset_df, dataset_embeddings
    
    print("Loading AI Models...")
    
    # --- A. Khởi tạo TF-IDF + Logistic Regression cho Phân loại Danh mục (Task 14) ---
    if DATASET_PATH.exists():
        print(f"Loading real dataset from {DATASET_PATH}...")
        dataset_df = pd.read_csv(DATASET_PATH)
        train_texts = dataset_df['description'].fillna("").tolist()
        train_labels = dataset_df['category_id'].tolist()
        
        # Update mapping dynamically from data
        unique_categories = dataset_df[['category_id', 'category_name']].drop_duplicates()
        CATEGORY_MAPPING = {row['category_id']: (row['category_id'], row['category_name']) for _, row in unique_categories.iterrows()}
    else:
        print(f"Dataset not found at {DATASET_PATH}, using dummy data...")
        train_texts = [
            "Cần người hướng dẫn Java Spring Boot", "Dạy ReactJS cơ bản", "Lập trình website với NodeJS",
            "Muốn luyện thi IELTS", "Dạy giao tiếp tiếng Anh", "Học tiếng Nhật N3",
            "Học thiết kế giao diện Figma", "Cần sửa poster Canva", "Hướng dẫn Photoshop cơ bản",
            "Học chạy quảng cáo Facebook", "Lập kế hoạch kinh doanh", "Quản lý tài chính cá nhân",
            "Cần gia sư Toán lớp 12", "Ôn thi Vật lý", "Hướng dẫn làm slide thuyết trình",
            "Tập Yoga cho người mới", "Học bơi cơ bản", "Lập lịch chạy bộ 5 km",
            "Dạy đàn guitar", "Học vẽ màu nước", "Hướng dẫn chơi piano",
            "Học nấu ăn gia đình", "Sửa máy giặt", "Hướng dẫn trồng rau ban công",
        ]
        train_labels = [
            1, 1, 1,
            2, 2, 2,
            3, 3, 3,
            4, 4, 4,
            5, 5, 5,
            6, 6, 6,
            7, 7, 7,
            8, 8, 8,
        ]
    
    # Ưu tiên bundle đã được đánh giá/huấn luyện offline. Nếu artifact chưa có
    # hoặc không hợp lệ, API vẫn tự train nhánh text để không bị ngừng phục vụ.
    if MODEL_PATH.exists():
        try:
            model_bundle = joblib.load(MODEL_PATH)
            if not isinstance(model_bundle, dict) or model_bundle.get('version') != 3:
                raise ValueError("Unsupported model bundle")
            model_category = model_bundle['text_classifier']
            model_semantic_classifier = model_bundle['semantic_classifier']
            model_text_weight = float(model_bundle.get('text_weight', TEXT_WEIGHT))
            model_semantic_weight = float(
                model_bundle.get('semantic_weight', SEMANTIC_WEIGHT)
            )
            bundled_embeddings = model_bundle.get('dataset_embeddings')
            if (
                bundled_embeddings is not None
                and dataset_df is not None
                and len(bundled_embeddings) == len(dataset_df)
            ):
                dataset_embeddings = np.asarray(
                    bundled_embeddings, dtype=np.float32
                )
            print("✅ Hybrid Logistic Regression bundle loaded!")
        except Exception as error:
            print(f"⚠️ Không thể đọc model bundle, sẽ train fallback: {error}")

    if model_category is None:
        model_category = build_text_classifier()
        model_category.fit(train_texts, train_labels)
        print("✅ Text classifier fallback trained!")

    # --- B. Load SentenceTransformer cho Semantic Matching (Task 15) ---
    # Dùng mô hình đa ngôn ngữ cực nhẹ, phù hợp tiếng Việt
    print(f"Downloading/Loading Sentence Transformer ({SEMANTIC_MODEL_NAME})...")
    try:
        model_semantic = SentenceTransformer(SEMANTIC_MODEL_NAME)
        print("✅ Model Semantic Matching loaded!")
        
        # Tiền tính toán embedding cho toàn bộ dataset để suggest nhanh hơn
        if dataset_df is not None and dataset_embeddings is None:
            print("Pre-computing embeddings for dataset...")
            dataset_embeddings = model_semantic.encode(
                dataset_df['description'].fillna("").tolist(),
                convert_to_tensor=True,
                normalize_embeddings=True,
            )
        if dataset_df is not None:
            if model_semantic_classifier is None:
                model_semantic_classifier = build_semantic_classifier()
                embedding_matrix = (
                    dataset_embeddings.cpu().numpy()
                    if hasattr(dataset_embeddings, 'cpu')
                    else np.asarray(dataset_embeddings)
                )
                model_semantic_classifier.fit(
                    embedding_matrix, train_labels
                )
                print("✅ Semantic Logistic Regression fallback trained!")
            
    except Exception as e:
        print(f"❌ Failed to load SentenceTransformer: {e}")

# -----------------
# 3. API ENDPOINTS
# -----------------

@app.post("/api/ai/predict-category", response_model=PredictCategoryResponse)
def predict_category(req: PredictCategoryRequest):
    if not model_category:
        raise HTTPException(status_code=500, detail="Mô hình chưa sẵn sàng")
        
    text = req.description
    if not text.strip():
        # Fallback category
        return PredictCategoryResponse(category_id=0, category_name="Khác", confidence=0.0)

    # Nhánh 1: TF-IDF theo từ/ký tự + Logistic Regression.
    text_probabilities = model_category.predict_proba([text])
    category_classes = model_category.classes_
    combined_probabilities = text_probabilities
    query_embedding = None

    # Nhánh 2: SentenceTransformer embedding + Logistic Regression.
    # Khi model semantic chưa tải được, API vẫn hoạt động bằng nhánh TF-IDF.
    if model_semantic is not None and model_semantic_classifier is not None:
        query_embedding = model_semantic.encode(
            [text], convert_to_tensor=True, normalize_embeddings=True
        )
        semantic_probabilities = model_semantic_classifier.predict_proba(
            query_embedding.cpu().numpy()
        )
        category_classes, combined_probabilities = blend_probabilities(
            model_category.classes_,
            text_probabilities,
            model_semantic_classifier.classes_,
            semantic_probabilities,
            text_weight=model_text_weight,
            semantic_weight=model_semantic_weight,
        )

    best_category_index = int(np.argmax(combined_probabilities[0]))
    pred_class = category_classes[best_category_index]
    confidence = float(combined_probabilities[0][best_category_index])
    
    cat_id, cat_name = CATEGORY_MAPPING.get(int(pred_class), (0, "Khác"))
    
    suggested_title = ""
    suggested_level = ""
    suggested_format = ""
    suggested_time = ""
    
    # 1. Trích xuất Semantic: Tìm câu giống nhất trong CSDL để lấy title và level
    if model_semantic is not None and dataset_embeddings is not None and dataset_df is not None:
        try:
            if query_embedding is None:
                query_embedding = model_semantic.encode(
                    [text], convert_to_tensor=True, normalize_embeddings=True
                )
            cos_scores = util.cos_sim(query_embedding, dataset_embeddings)[0]
            best_idx = int(np.argmax(cos_scores.cpu().numpy()))
            best_score = float(cos_scores[best_idx])
            
            # Nếu câu giống nhất có độ tự tin cao (> 0.5)
            if best_score > 0.5:
                row = dataset_df.iloc[best_idx]
                if pd.notna(row.get('skill_name')):
                    suggested_title = str(row['skill_name']).strip()
                if pd.notna(row.get('level')):
                    suggested_level = str(row['level']).strip()
                    if suggested_level.lower() == "không xác định":
                        suggested_level = ""
        except Exception as e:
            print(f"Lỗi khi semantic search: {e}")
            
    # 2. Trích xuất Heuristic (Từ khóa) cho Hình thức và Thời gian
    text_lower = text.lower()
    
    # Hình thức
    if any(k in text_lower for k in ["online", "trực tuyến", "từ xa", "qua mạng", "zoom", "meet"]):
        suggested_format = "Online"
    elif any(k in text_lower for k in ["offline", "trực tiếp", "gặp mặt", "tại nhà", "tại chỗ", "tận nơi"]):
        suggested_format = "Offline (Trực tiếp)"
        
    # Thời gian (Lọc đơn giản)
    time_keywords = ["cuối tuần", "thứ 7", "chủ nhật", "buổi tối", "buổi sáng", "buổi chiều", "sáng", "trưa", "chiều", "tối", "linh hoạt", "bất cứ lúc nào"]
    found_times = [k for k in time_keywords if k in text_lower]
    if found_times:
        # Gom các từ khóa lại, ưu tiên các cụm dài
        if "cuối tuần" in found_times:
            suggested_time = "Cuối tuần"
            if "buổi tối" in found_times or "tối" in found_times:
                suggested_time = "Tối cuối tuần"
        elif "buổi tối" in found_times or "tối" in found_times:
            suggested_time = "Buổi tối"
        elif "linh hoạt" in found_times or "bất cứ lúc nào" in found_times:
            suggested_time = "Linh hoạt"
        else:
            suggested_time = found_times[0].capitalize()
    
    return PredictCategoryResponse(
        category_id=cat_id,
        category_name=cat_name,
        confidence=confidence,
        suggested_title=suggested_title,
        suggested_level=suggested_level,
        suggested_format=suggested_format,
        suggested_time=suggested_time
    )


@app.post("/api/ai/recommend", response_model=RecommendResponse)
def recommend_helpers(req: RecommendRequest):
    if not model_semantic:
        raise HTTPException(status_code=500, detail="Mô hình ngữ nghĩa chưa sẵn sàng")

    req_desc = req.description
    # Lấy vector embedding của Yêu cầu
    req_emb = model_semantic.encode(req_desc, convert_to_tensor=True)

    recommendations = []
    
    for helper in req.helpers:
        # 1. Tính điểm Nội dung (Semantic Match)
        helper_text = f"{helper.skill_name}. {helper.skill_description}"
        helper_emb = model_semantic.encode(helper_text, convert_to_tensor=True)
        # Cosine similarity
        cosine_score = util.cos_sim(req_emb, helper_emb).item()
        
        # 2. Tính điểm Lịch rảnh (Heuristic đơn giản)
        schedule_score = 0.0
        # So khớp từ khóa (Trong thực tế cần bộ NLP bóc tách thời gian xịn hơn)
        if req.desired_time and helper.free_time:
            req_time_words = set(req.desired_time.lower().split())
            free_time_words = set(helper.free_time.lower().split())
            if len(req_time_words.intersection(free_time_words)) > 0:
                schedule_score = 1.0

        # 3. Điểm Uy tín (0 đến 5 sao -> chuẩn hóa về 0-1)
        reputation_score = min(5.0, max(0.0, helper.reputation_score)) / 5.0

        # TỔNG ĐIỂM (Trọng số: Nội dung 60%, Lịch 20%, Uy tín 20%)
        total_score = (cosine_score * 0.6) + (schedule_score * 0.2) + (reputation_score * 0.2)
        match_percent = min(100, max(0, int(total_score * 100)))

        # Sinh câu giải thích (Task 16)
        reasons = []
        if cosine_score >= 0.7:
            reasons.append(f"Kỹ năng rất sát với yêu cầu (Độ khớp {int(cosine_score*100)}%).")
        elif cosine_score >= 0.4:
            reasons.append("Kỹ năng có liên quan đến yêu cầu.")
            
        if schedule_score == 1.0:
            reasons.append("Lịch rảnh hoàn toàn trùng khớp.")
            
        if helper.reputation_score >= 4.5:
            reasons.append("Người hỗ trợ cực kỳ uy tín (>= 4.5 sao).")
        elif helper.reputation_score >= 4.0:
            reasons.append("Được đánh giá tốt.")
            
        if not reasons:
            reasons.append("Gợi ý mặc định.")

        recommendations.append(Recommendation(
            user_id=helper.user_id,
            skill_id=helper.skill_id,
            match_percentage=match_percent,
            reasons=reasons
        ))

    # Sắp xếp giảm dần theo phần trăm phù hợp
    recommendations.sort(key=lambda x: x.match_percentage, reverse=True)
    
    return RecommendResponse(recommendations=recommendations)


# source venv/bin/activate
# uvicorn main:app --reload --port 8000

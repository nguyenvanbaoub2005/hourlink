import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
import time
import joblib
import os

def train_and_evaluate():
    dataset_path = "docs/hourlink_skill_dataset_v2.csv"
    print(f"1. Đang đọc dữ liệu từ: {dataset_path} ...")
    
    try:
        df = pd.read_csv(dataset_path)
    except FileNotFoundError:
        print("Lỗi: Không tìm thấy file dữ liệu!")
        return

    print(f"Tổng số dòng dữ liệu: {len(df)}")
    
    # Loại bỏ các dòng bị rỗng nếu có
    df = df.dropna(subset=['description', 'category_name'])
    
    X = df['description']
    y = df['category_name'] 
    
    print("\n2. Chia tập dữ liệu: Tập huấn luyện (Train - 80%) và Tập kiểm thử (Test - 20%)...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"   - Số lượng học (Train): {len(X_train)} câu")
    print(f"   - Số lượng thi (Test): {len(X_test)} câu")
    
    print("\n3. Khởi tạo thuật toán AI (TF-IDF + Logistic Regression)...")
    model = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1,2))),
        ('clf', LogisticRegression(random_state=42, C=1.0, max_iter=1000, n_jobs=-1))
    ])
    
    print("4. Bắt đầu quá trình Huấn luyện (Training)...")
    start_time = time.time()
    model.fit(X_train, y_train)
    end_time = time.time()
    print(f"   -> 🚀 Huấn luyện xong trong {end_time - start_time:.2f} giây!")
    
    print("\n5. Đang cho AI thi thử nghiệm trên tập Test...")
    y_pred = model.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    print(f"   => 🏆 ĐỘ CHÍNH XÁC TỔNG THỂ (Accuracy): {acc * 100:.2f}%\n")
    
    report_text = classification_report(y_test, y_pred)
    print("📋 BẢNG ĐÁNH GIÁ CHI TIẾT TỪNG DANH MỤC (Classification Report):")
    print("-" * 70)
    print(report_text)
    
    # Lưu classification report ra file text để có thể đọc sau này
    with open("classification_report.txt", "w", encoding="utf-8") as f:
        f.write(report_text)
    
    # Vẽ Confusion Matrix
    print("\n6. Đang vẽ biểu đồ Confusion Matrix...")
    cm = confusion_matrix(y_test, y_pred, labels=model.classes_)
    plt.figure(figsize=(12, 10))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=model.classes_, yticklabels=model.classes_)
    plt.title('Ma trận nhầm lẫn (Confusion Matrix) - Đánh giá AI Phân loại')
    plt.xlabel('AI Dự đoán (Predicted)')
    plt.ylabel('Thực tế (True Label)')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png', dpi=300)
    print("   -> ✅ Đã lưu biểu đồ thành công vào file 'confusion_matrix.png'!")
    
    # 7. Lưu mô hình (Export)
    print("\n7. Đang đóng gói mô hình...")
    joblib.dump(model, 'model_category.pkl')
    print("   -> ✅ Đã lưu mô hình thành công vào file 'model_category.pkl'!")

if __name__ == "__main__":
    train_and_evaluate()

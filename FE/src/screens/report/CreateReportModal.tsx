import React, { useState } from 'react';
import ReportApi, { ReportTargetType, ReportReason, ReportRequest } from '../../api/report';

interface CreateReportModalProps {
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
}

export const CreateReportModal: React.FC<CreateReportModalProps> = ({ targetType, targetId, onClose }) => {
  const [reason, setReason] = useState<ReportReason>(ReportReason.SPAM);
  const [description, setDescription] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.length < 10) {
      setError('Mô tả phải có ít nhất 10 ký tự.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const urls = evidenceUrls.split(',').map(u => u.trim()).filter(u => u);
      const request: ReportRequest = {
        targetType,
        targetId,
        reason,
        description,
        evidenceUrls: urls.length > 0 ? urls : undefined,
      };
      
      await ReportApi.createReport(request);
      alert('Gửi báo cáo thành công! Chúng tôi sẽ xem xét sớm nhất.');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Báo cáo vi phạm</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Lý do:</label>
            <select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
              <option value={ReportReason.SPAM}>Spam</option>
              <option value={ReportReason.HARASSMENT}>Quấy rối</option>
              <option value={ReportReason.MISINFORMATION}>Thông tin sai lệch</option>
              <option value={ReportReason.ILLEGAL_CONTENT}>Nội dung vi phạm pháp luật</option>
              <option value={ReportReason.FRAUD}>Lừa đảo</option>
              <option value={ReportReason.OTHER}>Khác</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Mô tả chi tiết (ít nhất 10 ký tự):</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vui lòng cung cấp chi tiết vi phạm..."
              rows={4}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Link bằng chứng (cách nhau bằng dấu phẩy, tùy chọn):</label>
            <input 
              type="text"
              value={evidenceUrls}
              onChange={(e) => setEvidenceUrls(e.target.value)}
              placeholder="https://imgur.com/... , https://..."
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading} className="btn-cancel">Hủy</button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import ReportApi, { ReportResponse, ReportStatus } from '../../api/report';

export const ReportListScreen: React.FC = () => {
  const [reports, setReports] = useState<ReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | ''>('');

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await ReportApi.getMyReports(filterStatus ? (filterStatus as ReportStatus) : undefined);
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING: return '#f39c12'; // Orange
      case ReportStatus.REVIEWING: return '#3498db'; // Blue
      case ReportStatus.RESOLVED: return '#2ecc71'; // Green
      case ReportStatus.DISMISSED: return '#e74c3c'; // Red
      default: return '#7f8c8d';
    }
  };

  const getStatusText = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING: return 'Chờ xử lý';
      case ReportStatus.REVIEWING: return 'Đang xem xét';
      case ReportStatus.RESOLVED: return 'Đã giải quyết';
      case ReportStatus.DISMISSED: return 'Đã bác bỏ';
      default: return status;
    }
  };

  return (
    <div className="container">
      <div className="header-actions">
        <h1>Báo cáo của tôi</h1>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="filter-select"
        >
          <option value="">Tất cả trạng thái</option>
          <option value={ReportStatus.PENDING}>Chờ xử lý</option>
          <option value={ReportStatus.REVIEWING}>Đang xem xét</option>
          <option value={ReportStatus.RESOLVED}>Đã giải quyết</option>
          <option value={ReportStatus.DISMISSED}>Đã bác bỏ</option>
        </select>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : reports.length === 0 ? (
        <div className="empty-state">Bạn chưa gửi báo cáo nào.</div>
      ) : (
        <div className="report-list">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <h3>{report.reason}</h3>
                <span 
                  className="status-badge" 
                  style={{ backgroundColor: getStatusColor(report.status) }}
                >
                  {getStatusText(report.status)}
                </span>
              </div>
              
              <div className="report-body">
                <p><strong>Loại đối tượng:</strong> {report.targetType}</p>
                <p><strong>ID Đối tượng:</strong> {report.targetId}</p>
                <p><strong>Mô tả:</strong> {report.description}</p>
                <p className="report-date">
                  Gửi lúc: {new Date(report.createdAt).toLocaleString('vi-VN')}
                </p>
                
                {report.adminNote && (
                  <div className="admin-note">
                    <strong>Phản hồi từ Admin:</strong> {report.adminNote}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

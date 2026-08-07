export default function ReportsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Báo cáo</h1>
          <p className="page-subtitle">Tiếp nhận và xử lý báo cáo vi phạm</p>
        </div>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <p style={{ fontWeight: 600, fontSize: 15 }}>Module dang phat trien</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>GET /admin/reports</p>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Lịch hẹn</h1>
          <p className="page-subtitle">Xem toàn bộ lịch hẹn trong hệ thống</p>
        </div>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <p style={{ fontWeight: 600, fontSize: 15 }}>Module dang phat trien</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>GET /admin/appointments</p>
      </div>
    </div>
  );
}

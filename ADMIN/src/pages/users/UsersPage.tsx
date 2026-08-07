export default function UsersPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Người dùng</h1>
          <p className="page-subtitle">Xem, tìm kiếm và quản lý tài khoản người dùng</p>
        </div>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
        <p style={{ fontWeight: 600, fontSize: 15 }}>Module đang phát triển</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>Cần implement API: GET /admin/users</p>
      </div>
    </div>
  );
}

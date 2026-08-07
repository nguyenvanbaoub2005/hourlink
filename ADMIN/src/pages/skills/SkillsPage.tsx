export default function SkillsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Kỹ năng</h1>
          <p className="page-subtitle">Duyệt, ẩn và xoá kỹ năng vi phạm</p>
        </div>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <p style={{ fontWeight: 600, fontSize: 15 }}>Module dang phat trien</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>GET /admin/skills</p>
      </div>
    </div>
  );
}

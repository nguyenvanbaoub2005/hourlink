export default function WalletPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ví Time Credit</h1>
          <p className="page-subtitle">Tổng quan giao dịch và phát hiện bất thường</p>
        </div>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <p style={{ fontWeight: 600, fontSize: 15 }}>Module dang phat trien</p>
        <p style={{ fontSize: 13, marginTop: 6 }}>GET /admin/wallet/overview</p>
      </div>
    </div>
  );
}

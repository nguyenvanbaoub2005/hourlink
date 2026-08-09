import { useState, useEffect } from 'react';
import {
  X, User, BookOpen, MapPin, Clock, Monitor, AlertTriangle, Trash2, Star, CheckCircle, HeartHandshake
} from 'lucide-react';
import type { AdminHelpRequestDetailResponse } from '@/api/helpRequests';
import { helpRequestsApi } from '@/api/helpRequests';
import SkillActionModal from './SkillActionModal';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  SEARCHING: { label: 'Đang tìm', color: 'text-primary bg-primary/10' },
  ASSIGNED:  { label: 'Đã nhận',  color: 'text-info bg-info/10' },
  COMPLETED: { label: 'Hoàn thành', color: 'text-success bg-success/10' },
  CANCELLED: { label: 'Đã hủy', color: 'text-text-muted bg-surface-2' },
  DELETED:   { label: 'Đã xóa', color: 'text-danger bg-danger/10' },
};

interface HelpRequestDetailModalProps {
  requestId: string | null;
  onClose: () => void;
  onActionDone: () => void;
}

export default function HelpRequestDetailModal({
  requestId, onClose, onActionDone,
}: HelpRequestDetailModalProps) {
  const [detail, setDetail] = useState<AdminHelpRequestDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'DELETE' | 'WARN';
  }>({ open: false, type: 'DELETE' });

  useEffect(() => {
    if (!requestId) { setDetail(null); return; }
    setLoading(true);
    helpRequestsApi.getHelpRequestDetail(requestId)
      .then(setDetail)
      .catch(() => toast.error('Không thể tải chi tiết yêu cầu hỗ trợ'))
      .finally(() => setLoading(false));
  }, [requestId]);

  const handleAction = async (reason: string) => {
    if (!detail) return;
    await helpRequestsApi.performAction(detail.id, actionModal.type, reason || undefined);
    
    let msg = 'Thao tác thành công!';
    if (actionModal.type === 'DELETE') msg = 'Đã xóa yêu cầu hỗ trợ thành công!';
    else if (actionModal.type === 'WARN') msg = 'Đã gửi cảnh báo người dùng thành công!';

    toast.success(msg);
    onActionDone();
    if (actionModal.type === 'DELETE') {
      onClose();
    } else {
      const updated = await helpRequestsApi.getHelpRequestDetail(detail.id);
      setDetail(updated);
    }
  };

  const openAction = (type: 'DELETE' | 'WARN') => {
    setActionModal({ open: true, type });
  };

  if (!requestId) return null;

  const statusCfg = detail ? STATUS_CONFIG[detail.status] : null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2 className="text-base font-bold text-text flex items-center gap-2">
              <HeartHandshake size={18} className="text-primary"/> Chi tiết Yêu cầu hỗ trợ
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text transition">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : detail ? (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-text">{detail.title}</h3>
                    {statusCfg && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {detail.categoryName && (
                      <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-surface-2 px-2 py-1 rounded-md border border-border">
                        <BookOpen size={12} /> {detail.categoryName}
                      </span>
                    )}
                    {detail.format && (
                      <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-surface-2 px-2 py-1 rounded-md border border-border">
                        <Monitor size={12} /> {detail.format === 'ONLINE' ? 'Trực tuyến' : 'Trực tiếp'}
                      </span>
                    )}
                    {detail.duration && (
                      <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-surface-2 px-2 py-1 rounded-md border border-border">
                        <Clock size={12} /> {detail.duration} phút / buổi
                      </span>
                    )}
                    {detail.region && (
                      <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-surface-2 px-2 py-1 rounded-md border border-border">
                        <MapPin size={12} /> {detail.region}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-md font-semibold border border-primary/20">
                      {detail.timeCreditAmount} TC
                    </span>
                  </div>
                </div>

                {detail.description && (
                  <div className="p-4 bg-surface-2 rounded-xl border border-border">
                    <p className="text-sm text-text-muted mb-1 font-semibold">Nội dung chi tiết</p>
                    <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{detail.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {detail.currentLevel && (
                    <div className="flex flex-col">
                      <span className="text-xs text-text-muted mb-1">Trình độ hiện tại</span>
                      <span className="text-sm font-medium text-text">{detail.currentLevel}</span>
                    </div>
                  )}
                  {detail.desiredTime && (
                    <div className="flex flex-col">
                      <span className="text-xs text-text-muted mb-1">Thời gian mong muốn</span>
                      <span className="text-sm font-medium text-text">{detail.desiredTime}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-surface-2 rounded-xl border border-border">
                  <p className="text-sm font-semibold text-text mb-3 flex items-center gap-1.5">
                    <User size={15} /> Người yêu cầu
                  </p>
                  <div className="flex items-center gap-3">
                    {detail.requesterAvatarUrl ? (
                      <img src={detail.requesterAvatarUrl} alt={detail.requesterFullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-border" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                        {detail.requesterFullName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-text">{detail.requesterFullName}</p>
                      <p className="text-xs text-text-muted">{detail.requesterEmail}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1 text-sm">
                        <Star size={13} className="text-warning fill-warning" />
                        <span className="font-bold text-text">{detail.requesterReputationScore?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <CheckCircle size={12} className="text-success" />
                        {detail.requesterCompletedSessions} buổi
                      </div>
                      {detail.requesterWarningCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-danger">
                          <AlertTriangle size={12} />
                          {detail.requesterWarningCount} cảnh báo
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Action Footer */}
          {detail && (
            <div className="px-6 py-4 border-t border-border shrink-0 bg-surface">
              <div className="flex flex-wrap gap-2 justify-end">
                {detail.status !== 'DELETED' && (
                  <>
                    <button
                      onClick={() => openAction('WARN')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 rounded-xl transition"
                    >
                      <AlertTriangle size={15} /> Cảnh báo
                    </button>
                    <button
                      onClick={() => openAction('DELETE')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-danger bg-danger/10 hover:bg-danger/20 rounded-xl transition"
                    >
                      <Trash2 size={15} /> Xóa yêu cầu
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {detail && (
        <SkillActionModal
          isOpen={actionModal.open}
          onClose={() => setActionModal(p => ({ ...p, open: false }))}
          onConfirm={handleAction}
          actionType={actionModal.type}
          skillName={detail.title} // Reusing SkillActionModal, name fits well
        />
      )}
    </>
  );
}

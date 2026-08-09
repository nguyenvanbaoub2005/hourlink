import { useState, useEffect, useCallback } from 'react';
import {
  X, User, BookOpen, MapPin, Clock, Monitor, FileText, Image as ImageIcon,
  Download, AlertTriangle, EyeOff, Eye, Trash2, Star, CheckCircle, Plus, Loader2, ExternalLink, ZoomIn,
} from 'lucide-react';
import type { AdminSkillDetailResponse, SkillAttachment } from '@/api/skills';
import { skillsApi } from '@/api/skills';
import SkillActionModal from './SkillActionModal';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────

const STATUS_CONFIG = {
  VISIBLE: { label: 'Đang hiển thị', color: 'text-success bg-success/10' },
  HIDDEN:  { label: 'Đã ẩn',         color: 'text-warning bg-warning/10' },
  DELETED: { label: 'Đã xóa',        color: 'text-danger bg-danger/10'   },
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Mới bắt đầu',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
  EXPERT: 'Chuyên gia',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(err: any, defaultMsg: string): string {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.error) return err.response.data.error;
  if (typeof err.response?.data === 'string' && err.response.data) return err.response.data;
  if (err.message) return err.message;
  return defaultMsg;
}

// ─── Component ────────────────────────────────────────────────

interface SkillDetailModalProps {
  skillId: string | null;
  onClose: () => void;
  onActionDone: () => void;
}

export default function SkillDetailModal({
  skillId, onClose, onActionDone,
}: SkillDetailModalProps) {
  const [detail, setDetail] = useState<AdminSkillDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [docViewerUrl, setDocViewerUrl] = useState<{ url: string; name: string } | null>(null);

  const [actionModal, setActionModal] = useState<{
    open: boolean;
    type: 'HIDE' | 'SHOW' | 'DELETE' | 'WARN';
  }>({ open: false, type: 'HIDE' });

  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SkillAttachment | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (url: string, filename: string, id?: string) => {
    const key = id ?? url;
    setDownloadingId(key);
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: if CORS blocks fetch, open directly
      window.open(url, '_blank');
      toast.error('Không thể tải trực tiếp, đã mở trong thẻ mới');
    } finally {
      setDownloadingId(null);
    }
  };

  const reloadDetail = useCallback(async () => {
    if (!skillId) return;
    try {
      const updated = await skillsApi.getSkillDetail(skillId);
      setDetail(updated);
    } catch {
      toast.error('Không thể tải lại dữ liệu');
    }
  }, [skillId]);

  useEffect(() => {
    if (!skillId) { setDetail(null); return; }
    setLoading(true);
    skillsApi.getSkillDetail(skillId)
      .then(setDetail)
      .catch(() => toast.error('Không thể tải chi tiết kỹ năng'))
      .finally(() => setLoading(false));
  }, [skillId]);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxUrl && !docViewerUrl) return;
    const handler = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') {
        setLightboxUrl(null);
        setDocViewerUrl(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxUrl, docViewerUrl]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !skillId) return;
    e.target.value = '';

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Dung lượng file tối đa là 20MB');
      return;
    }

    try {
      setIsUploading(true);
      const res = await skillsApi.uploadAttachment(skillId, file);
      if (res?.data) {
        toast.success('Đã tải minh chứng lên thành công!');
      } else {
        toast.success('Đã tải minh chứng lên thành công!');
      }
      await reloadDetail();
      onActionDone();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(getErrorMessage(err, 'Không thể tải minh chứng lên. Vui lòng thử lại.'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const att = deleteTarget;
    setDeleteTarget(null);
    try {
      await skillsApi.deleteAttachment(att.id);
      toast.success('Đã xóa minh chứng thành công!');
      await reloadDetail();
      onActionDone();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(getErrorMessage(err, 'Không thể xóa minh chứng.'));
    }
  };

  const handleAction = async (reason: string) => {
    if (!detail) return;
    await skillsApi.performAction(detail.id, actionModal.type, reason || undefined);

    let msg = 'Thao tác thành công!';
    if (actionModal.type === 'HIDE') msg = 'Đã ẩn kỹ năng thành công!';
    else if (actionModal.type === 'SHOW') msg = 'Đã hiện lại kỹ năng thành công!';
    else if (actionModal.type === 'DELETE') msg = 'Đã xóa kỹ năng thành công!';
    else if (actionModal.type === 'WARN') msg = 'Đã gửi cảnh báo người dùng thành công!';

    toast.success(msg);
    onActionDone();
    if (actionModal.type === 'DELETE') {
      onClose();
    } else {
      const updated = await skillsApi.getSkillDetail(detail.id);
      setDetail(updated);
    }
  };

  if (!skillId) return null;

  const images = detail?.attachments.filter(a => a.fileType === 'IMAGE') ?? [];
  const documents = detail?.attachments.filter(a => a.fileType === 'DOCUMENT') ?? [];
  const statusCfg = detail ? STATUS_CONFIG[detail.status as keyof typeof STATUS_CONFIG] : null;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2 className="text-base font-bold text-text">Chi tiết kỹ năng</h2>
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
                {/* Skill Header */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-xl font-bold text-text">{detail.name}</h3>
                      {statusCfg && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {detail.categoryName && (
                        <span className="inline-flex items-center gap-1 text-xs text-text-muted bg-surface-2 px-2 py-1 rounded-md border border-border">
                          <BookOpen size={12} /> {detail.categoryName}
                        </span>
                      )}
                      {detail.level && (
                        <span className="text-xs text-text-muted bg-surface-2 px-2 py-1 rounded-md border border-border">
                          {LEVEL_LABEL[detail.level] ?? detail.level}
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
                    </div>
                  </div>
                </div>

                {/* Description */}
                {detail.description && (
                  <div className="p-4 bg-surface-2 rounded-xl border border-border">
                    <p className="text-sm text-text-muted mb-1 font-semibold">Mô tả</p>
                    <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{detail.description}</p>
                  </div>
                )}

                {/* Free time */}
                {detail.freeTime && (
                  <div className="flex items-start gap-2 text-sm text-text-muted">
                    <Clock size={15} className="shrink-0 mt-0.5" />
                    <span><strong className="text-text">Thời gian rảnh:</strong> {detail.freeTime}</span>
                  </div>
                )}

                {/* Người đăng */}
                <div className="p-4 bg-surface-2 rounded-xl border border-border">
                  <p className="text-sm font-semibold text-text mb-3 flex items-center gap-1.5">
                    <User size={15} /> Người đăng
                  </p>
                  <div className="flex items-center gap-3">
                    {detail.userAvatarUrl ? (
                      <img src={detail.userAvatarUrl} alt={detail.userFullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-border" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                        {detail.userFullName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-text">{detail.userFullName}</p>
                      <p className="text-xs text-text-muted">{detail.userEmail}</p>
                      {detail.userOccupation && (
                        <p className="text-xs text-text-muted">{detail.userOccupation}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1 text-sm">
                        <Star size={13} className="text-warning fill-warning" />
                        <span className="font-bold text-text">{detail.userReputationScore?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <CheckCircle size={12} className="text-success" />
                        {detail.userCompletedSessions} buổi
                      </div>
                      {detail.userWarningCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-danger">
                          <AlertTriangle size={12} />
                          {detail.userWarningCount} cảnh báo
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─── Minh chứng Section ─── */}
                <div className="border-t border-border pt-4 space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-text text-base flex items-center gap-2">
                      <ImageIcon size={18} className="text-primary" />
                      Minh chứng kỹ năng ({detail.attachments.length})
                    </h3>
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                      isUploading
                        ? 'bg-surface-2 text-text-muted cursor-not-allowed'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }`}>
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      <span>{isUploading ? 'Đang tải...' : 'Thêm minh chứng'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.ppt,.pptx"
                        onChange={handleUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Ảnh minh chứng — Grid */}
                  {images.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-2">Ảnh minh chứng ({images.length})</p>
                      <div className="grid grid-cols-3 gap-2">
                        {images.map((img) => (
                          <div
                            key={img.id}
                            className="relative group/img aspect-square rounded-xl overflow-hidden border border-border bg-surface-2 cursor-pointer"
                            onClick={() => setLightboxUrl(img.fileUrl)}
                          >
                            <img
                              src={img.fileUrl}
                              alt={img.originalName}
                              className="w-full h-full object-cover transition group-hover/img:scale-105 duration-200"
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200" />
                            {/* Delete button top-right */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(img);
                              }}
                              className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-700 shadow"
                              title={`Xóa ${img.originalName}`}
                            >
                              <Trash2 size={12} />
                            </button>
                            {/* File name bottom */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                              <p className="text-white text-[10px] truncate">{img.originalName}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tài liệu minh chứng */}
                  {documents.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-muted mb-2">Tài liệu minh chứng ({documents.length})</p>
                      <div className="space-y-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-surface-2 border border-border rounded-xl hover:border-primary/40 transition"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <FileText size={17} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text truncate">{doc.originalName}</p>
                                <p className="text-xs text-text-muted">{formatFileSize(doc.fileSize)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {/* View / Open */}
                              <button
                                type="button"
                                className="p-1.5 hover:bg-primary/10 rounded-lg text-text-muted hover:text-primary transition"
                                title="Xem tài liệu"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDocViewerUrl({ url: doc.fileUrl, name: doc.originalName });
                                }}
                              >
                                <Eye size={15} />
                              </button>
                              {/* Download */}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDownload(doc.fileUrl, doc.originalName, doc.id); }}
                                className="p-1.5 hover:bg-surface rounded-lg text-text-muted hover:text-primary transition"
                                title="Tải xuống"
                                disabled={downloadingId === doc.id}
                              >
                                {downloadingId === doc.id
                                  ? <Loader2 size={15} className="animate-spin" />
                                  : <Download size={15} />}
                              </button>
                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(doc)}
                                className="p-1.5 hover:bg-red-100 rounded-lg text-text-muted hover:text-danger transition"
                                title={`Xóa ${doc.originalName}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {detail.attachments.length === 0 && (
                    <div className="text-center py-10 text-text-muted bg-surface-2/50 rounded-2xl border border-dashed border-border">
                      <ImageIcon size={36} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">Chưa có minh chứng nào</p>
                      <p className="text-xs mt-1 opacity-60">Bấm "+ Thêm minh chứng" để tải ảnh hoặc tài liệu bằng cấp, chứng chỉ.</p>
                    </div>
                  )}
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
                      onClick={() => setActionModal({ open: true, type: 'WARN' })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 rounded-xl transition"
                    >
                      <AlertTriangle size={15} /> Cảnh báo
                    </button>
                    {detail.status === 'VISIBLE' ? (
                      <button
                        onClick={() => setActionModal({ open: true, type: 'HIDE' })}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-warning bg-warning/10 hover:bg-warning/20 rounded-xl transition"
                      >
                        <EyeOff size={15} /> Ẩn kỹ năng
                      </button>
                    ) : (
                      <button
                        onClick={() => setActionModal({ open: true, type: 'SHOW' })}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-success bg-success/10 hover:bg-success/20 rounded-xl transition"
                      >
                        <Eye size={15} /> Hiện lại
                      </button>
                    )}
                    <button
                      onClick={() => setActionModal({ open: true, type: 'DELETE' })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-danger bg-danger/10 hover:bg-danger/20 rounded-xl transition"
                    >
                      <Trash2 size={15} /> Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Lightbox ─── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={22} />
          </button>
          <img
            src={lightboxUrl}
            alt="Xem ảnh"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ─── Document Viewer (positioned within content area, sidebar+header stay visible) ─── */}
      {docViewerUrl && (
        <div
          className="fixed z-[70] flex flex-col bg-surface shadow-2xl border-l border-border"
          style={{ left: 240, top: 60, right: 0, bottom: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 bg-surface border-b border-border shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text truncate max-w-[50vw]">{docViewerUrl.name}</p>
                <p className="text-xs text-text-muted">Tài liệu minh chứng</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`https://docs.google.com/viewer?url=${encodeURIComponent(docViewerUrl.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-primary bg-surface-2 hover:bg-primary/10 border border-border rounded-lg transition"
              >
                <ExternalLink size={13} /> Mở trong thẻ mới
              </a>
              <button
                type="button"
                onClick={() => handleDownload(docViewerUrl.url, docViewerUrl.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-primary bg-surface-2 hover:bg-primary/10 border border-border rounded-lg transition"
                disabled={downloadingId === docViewerUrl.url}
              >
                {downloadingId === docViewerUrl.url
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Download size={13} />} Tải xuống
              </button>
              <button
                className="p-2 bg-surface-2 hover:bg-surface-3 text-text-muted hover:text-text rounded-lg transition border border-border"
                onClick={() => setDocViewerUrl(null)}
                title="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          {/* Iframe */}
          <div className="flex-1 overflow-hidden bg-[#f5f5f5]">
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(docViewerUrl.url)}&embedded=true`}
              className="w-full h-full border-0"
              title={docViewerUrl.name}
            />
          </div>
        </div>
      )}

      {/* Action confirmation modal */}
      {detail && (
        <SkillActionModal
          isOpen={actionModal.open}
          onClose={() => setActionModal(p => ({ ...p, open: false }))}
          onConfirm={handleAction}
          actionType={actionModal.type}
          skillName={detail.name}
        />
      )}

      {/* Delete attachment confirm */}
      {deleteTarget && (
        <Modal
          isOpen={true}
          title="Xác nhận xóa minh chứng"
          message={`Bạn có chắc chắn muốn xóa file "${deleteTarget.originalName}" không? File sẽ bị xóa vĩnh viễn.`}
          confirmText="Xóa minh chứng"
          cancelText="Hủy"
          type="danger"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
}

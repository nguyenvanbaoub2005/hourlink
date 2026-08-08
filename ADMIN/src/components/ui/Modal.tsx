import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'primary';
  showInput?: boolean;
  inputValue?: string;
  onInputChange?: (val: string) => void;
  inputPlaceholder?: string;
}

export default function Modal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'primary',
  showInput = false,
  inputValue = '',
  onInputChange,
  inputPlaceholder
}: ModalProps) {
  if (!isOpen) return null;

  const getConfirmBtnStyle = () => {
    switch (type) {
      case 'danger': return 'bg-red-500 hover:bg-red-600 focus:ring-red-500/30';
      case 'warning': return 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500/30';
      default: return 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            {message}
          </p>
          {showInput && (
            <textarea
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 resize-none outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder={inputPlaceholder || 'Nhập lý do...'}
              value={inputValue}
              onChange={(e) => onInputChange?.(e.target.value)}
              rows={3}
            />
          )}
        </div>
        
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 ${getConfirmBtnStyle()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { memo } from 'react';
import { AlertCircle, CheckCircle, HelpCircle, X } from 'lucide-react';
import Button from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

const ConfirmDialog = memo(({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
}: ConfirmDialogProps) => {
  if (!open) return null;

  const iconConfig = {
    danger: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50' },
    warning: { icon: HelpCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    info: { icon: HelpCircle, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    success: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
  };

  const config = iconConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className={`${config.bgColor} rounded-lg p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-300 border border-gray-200`}>
        <div className="flex items-start gap-4 mb-4">
          <Icon className={`w-6 h-6 ${config.color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
            <p className="text-sm text-gray-700">{message}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={type === 'danger' ? 'danger' : 'primary'}
            disabled={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
});

ConfirmDialog.displayName = 'ConfirmDialog';

export default ConfirmDialog;

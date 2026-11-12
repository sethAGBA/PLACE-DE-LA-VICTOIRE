import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface RejectModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Standalone modal for rejecting an order.
 * Requires a non-empty rejectedReason before allowing confirmation.
 */
export function RejectModal({
  open,
  loading = false,
  onClose,
  onConfirm,
}: RejectModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal
      open={open}
      title={t('serveur.rejectConfirm')}
      onClose={handleClose}
    >
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          {t('serveur.rejectReason')}
          <span className="ml-1 text-red-500" aria-hidden="true">*</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            required
            aria-required="true"
            placeholder={t('serveur.rejectReason')}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={handleClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={loading}
            disabled={!reason.trim()}
            onClick={handleConfirm}
          >
            {t('serveur.reject')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

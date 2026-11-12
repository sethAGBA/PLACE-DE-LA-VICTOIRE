import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';

interface QRCodeDisplayProps {
  tableId: string;
  numero: number;
}

export function QRCodeDisplay({ tableId, numero }: QRCodeDisplayProps) {
  const { t } = useTranslation();
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  const url = `${window.location.origin}/table/${tableId}`;

  function handleDownload() {
    const canvas = canvasWrapperRef.current?.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `table-${numero}.png`;
    link.click();
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error('Clipboard write failed', err);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={canvasWrapperRef} className="rounded-xl border p-4">
        <QRCodeCanvas
          value={url}
          size={200}
          bgColor="#ffffff"
          fgColor="#D4580A"
          level="H"
          includeMargin
        />
      </div>

      <p className="max-w-xs break-all text-center text-xs text-gray-500">{url}</p>

      <div className="flex gap-3">
        <Button size="sm" onClick={handleDownload}>
          {t('admin.tables.download')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void handleCopyLink()}>
          {t('admin.tables.copyLink')}
        </Button>
      </div>
    </div>
  );
}

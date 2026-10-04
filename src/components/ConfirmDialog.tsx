type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-coffee-950/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card w-full max-w-sm animate-scale-in">
        <div className="p-6">
          <h3 className="font-display font-bold text-lg text-coffee-950 mb-2">{title}</h3>
          <p className="text-coffee-600 text-sm mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <button onClick={onCancel} className="btn-secondary">Batal</button>
            <button onClick={onConfirm} className="btn-danger">{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

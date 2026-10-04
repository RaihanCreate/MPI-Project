import { type ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
};

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-coffee-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative card w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-scale-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-coffee-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="font-display font-bold text-lg text-coffee-950">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-coffee-100 text-coffee-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

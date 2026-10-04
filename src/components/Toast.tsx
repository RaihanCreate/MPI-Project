type ToastProps = {
  message: string;
  type?: 'success' | 'error';
  show: boolean;
};

export default function Toast({ message, type = 'success', show }: ToastProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-slide-up">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg font-semibold text-sm
          ${type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
          }`}
      >
        {message}
      </div>
    </div>
  );
}

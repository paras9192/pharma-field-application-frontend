import toast, { type Toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { getNotificationIcon } from './notificationMeta';
import type { NotificationType } from '@/types/api';

interface PushToastProps {
  t: Toast;
  title: string;
  body?: string;
  type?: NotificationType;
  onClick: () => void;
}

export function PushToast({ t, title, body, type, onClick }: PushToastProps) {
  const { icon: Icon, className } = getNotificationIcon(type);

  return (
    <div
      className={`${t.visible ? 'animate-toast-in' : 'animate-toast-out'} w-[min(92vw,380px)] bg-white rounded-2xl shadow-xl ring-1 ring-slate-900/5 border-l-4 border-teal-500 flex items-stretch overflow-hidden pointer-events-auto`}
    >
      <button
        onClick={() => { onClick(); toast.dismiss(t.id); }}
        className="flex-1 flex items-start gap-3 min-w-0 p-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${className}`}>
          <Icon size={17} />
        </span>
        <span className="min-w-0 flex-1 pt-0.5">
          <span className="block text-sm font-semibold text-slate-800 leading-snug line-clamp-1">{title}</span>
          {body && <span className="block text-xs text-slate-500 mt-0.5 leading-snug line-clamp-2">{body}</span>}
        </span>
      </button>
      <button
        onClick={() => toast.dismiss(t.id)}
        aria-label="Dismiss"
        className="flex-shrink-0 px-2.5 text-slate-300 hover:text-slate-500 transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  );
}

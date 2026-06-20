import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message = 'Something went wrong', onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <AlertCircle size={40} className="text-red-400 mb-3" />
      <p className="text-sm text-slate-600 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={14} />
          Retry
        </Button>
      )}
    </div>
  );
}

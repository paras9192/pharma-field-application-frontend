import { useRef, useState } from 'react';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { BACKEND_ORIGIN } from '@/api/axios';

interface CameraInputProps {
  onCapture: (file: File) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function CameraInput({ onCapture, loading, disabled }: CameraInputProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const handleFile = (file: File) => {
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleConfirm = () => {
    if (pendingFile) {
      onCapture(pendingFile);
      setPreview(null);
      setPendingFile(null);
    }
  };

  const handleRetake = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPendingFile(null);
  };

  if (preview) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <img src={preview} alt="Preview" className="w-full max-h-56 object-contain" />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" fullWidth onClick={handleRetake} disabled={loading}>
            <RotateCcw size={14} /> Retake
          </Button>
          <Button type="button" size="sm" fullWidth loading={loading} onClick={handleConfirm}>
            Upload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {isMobile && (
        <>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            fullWidth
            disabled={disabled || loading}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera size={14} /> Take Photo
          </Button>
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        fullWidth
        disabled={disabled || loading}
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={14} /> {isMobile ? 'Gallery' : 'Upload Photo'}
      </Button>
    </div>
  );
}

interface ImageGalleryProps {
  images: Array<{ id: number; url: string; filename: string }>;
  onDelete?: (imageId: number) => void;
  deletingId?: number | null;
}

export function ImageGallery({ images, onDelete, deletingId }: ImageGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {images.map(img => (
        <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <img
            src={`${BACKEND_ORIGIN}${img.url}`}
            alt={img.filename}
            className="w-full h-32 object-cover"
          />
          {onDelete && (
            <button
              type="button"
              onClick={() => { if (confirm('Delete this image?')) onDelete(img.id); }}
              disabled={deletingId === img.id}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

import imageCompression from 'browser-image-compression';

const OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

/**
 * Compress an image file to ~1 MB before upload. Non-image files (PDFs etc.)
 * are returned untouched. If compression fails for any reason, the original
 * file is uploaded instead — a big upload is better than no upload.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const compressed = await imageCompression(file, OPTIONS);
    // The lib returns a File already, but ensure the original name survives.
    return new File([compressed], file.name, { type: compressed.type });
  } catch {
    return file;
  }
}

export function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}

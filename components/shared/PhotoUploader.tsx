'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, X, Loader2, ZoomIn } from 'lucide-react';
import { uploadToStorage } from '@/lib/supabase';

type Props = {
  photos: string[];
  onChange: (urls: string[]) => void;
};

type PreviewState = { urls: string[]; index: number } | null;

const MAX = 5;

export function PhotoUploader({ photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<PreviewState>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    if (photos.length >= MAX) {
      setError(`Maximum ${MAX} photos allowed`);
      return;
    }
    setError('');
    const remaining = MAX - photos.length;
    const files = Array.from(fileList)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining);

    if (files.length === 0) return;
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${crypto.randomUUID()}.${ext}`;
      const url = await uploadToStorage('property-photos', path, file);
      if (url) uploaded.push(url);
    }

    if (uploaded.length < files.length) {
      setError('Some photos failed to upload — check your connection');
    }
    onChange([...photos, ...uploaded]);
    setUploading(false);
    // Reset so the same file can be re-selected after removal
    if (inputRef.current) inputRef.current.value = '';
  }

  function remove(url: string) {
    onChange(photos.filter((u) => u !== url));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Photos <span className="text-gray-400 font-normal">({photos.length}/{MAX})</span>
      </label>

      {/* Thumbnails grid */}
      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photos.map((url, i) => (
            <div
              key={url}
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group flex-shrink-0"
            >
              <Image src={url} alt={`photo ${i + 1}`} fill className="object-cover" sizes="80px" />
              {/* Zoom */}
              <button
                type="button"
                onClick={() => setPreview({ urls: photos, index: i })}
                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
              >
                <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              {/* Remove */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(url); }}
                className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] text-center py-0.5 pointer-events-none">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone — hidden once max reached */}
      {photos.length < MAX && (
        <div
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            uploading
              ? 'border-primary-300 bg-primary-50 cursor-default'
              : dragging
              ? 'border-primary-400 bg-primary-50 cursor-copy'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50 cursor-pointer'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-primary-600">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm font-medium">Uploading…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-gray-400">
              <ImagePlus className="h-7 w-7" />
              <p className="text-sm">
                Drag photos here or{' '}
                <span className="text-primary-600 font-medium">click to select</span>
              </p>
              <p className="text-xs">JPG, PNG, WEBP · max 5 MB each · up to {MAX} photos</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Preview lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white p-1.5"
          >
            <X className="h-6 w-6" />
          </button>
          {preview.urls.length > 1 && (
            <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {preview.index + 1} / {preview.urls.length}
            </span>
          )}
          {preview.index > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreview((p) => p && { ...p, index: p.index - 1 }); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2"
            >
              <span className="text-3xl leading-none">‹</span>
            </button>
          )}
          <div
            className="relative mx-16 max-w-4xl w-full"
            style={{ maxHeight: '88vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={preview.urls[preview.index]}
              alt="preview"
              width={1400}
              height={900}
              className="object-contain w-full rounded-lg"
              style={{ maxHeight: '88vh' }}
              sizes="100vw"
              priority
            />
          </div>
          {preview.index < preview.urls.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreview((p) => p && { ...p, index: p.index + 1 }); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2"
            >
              <span className="text-3xl leading-none">›</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

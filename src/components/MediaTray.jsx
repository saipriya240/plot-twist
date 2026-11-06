import { useEffect, useRef, useState } from 'react';
import { Loader2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { uploadPrivate } from '@/lib/media';
import MediaThumb from '@/components/MediaThumb';
import { toast } from '@/components/ui/use-toast';

export default function MediaTray({ media, onChange, accept = 'image/*', kind = 'image', addLabel = 'Add photos' }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      const next = [];
      for (const file of Array.from(files)) {
        const uri = await uploadPrivate(file);
        next.push({ url: uri, type: kind, caption: '' });
      }
      onChange([...media, ...next]);
    } catch (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const next = [...media];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const updateCaption = (index, caption) => {
    const next = media.map((item, i) => (i === index ? { ...item, caption } : item));
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {media.map((item, index) => (
          <div key={`${item.url}-${index}`} className="overflow-hidden rounded-md border border-ink-line bg-ink-card">
            <div className="relative">
              <MediaThumb fileRef={item.url} kind={item.type === 'video' ? 'video' : 'image'} className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(media.filter((_, i) => i !== index))}
                aria-label="Remove"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink-base/80 text-white"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                <button type="button" onClick={() => move(index, -1)} aria-label="Move earlier" className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-base/80 text-white">
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => move(index, 1)} aria-label="Move later" className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-base/80 text-white">
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>
            </div>
            <input
              value={item.caption || ''}
              onChange={(e) => updateCaption(index, e.target.value)}
              placeholder="Caption…"
              className="w-full bg-transparent px-2 py-1.5 text-[11px] text-white/80 placeholder:text-white/25 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="t-kicker mt-2 flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-ink-line py-9 text-white/45 disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {uploading ? 'Uploading' : addLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
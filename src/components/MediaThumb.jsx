import { Image } from '@/components/ui/image';
import { useFileUrl } from '@/lib/media';

export default function MediaThumb({ fileRef, kind = 'image', alt = '', className = '', videoProps }) {
  const url = useFileUrl(fileRef);

  if (!url) {
    return <div className={`${className} animate-pulse bg-white/[0.06]`} aria-hidden="true" />;
  }

  if (kind === 'video') {
    return <video src={url} className={className} controls playsInline preload="metadata" {...videoProps} />;
  }

  return <Image src={url} alt={alt} className={className} fittingType="fill" />;
}
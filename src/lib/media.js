import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const cache = new Map();
const isDirect = (ref) => typeof ref === 'string' && /^(https?:|blob:|data:)/.test(ref);

export async function resolveFileUrl(ref) {
  if (!ref) return null;
  if (isDirect(ref)) return ref;
  if (cache.has(ref)) return cache.get(ref);
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: ref, expires_in: 3600 });
  cache.set(ref, signed_url);
  return signed_url;
}

export function useFileUrl(ref) {
  const [url, setUrl] = useState(() => (isDirect(ref) ? ref : null));

  useEffect(() => {
    let alive = true;
    if (!ref) {
      setUrl(null);
      return undefined;
    }
    if (isDirect(ref)) {
      setUrl(ref);
      return undefined;
    }
    setUrl(null);
    resolveFileUrl(ref)
      .then((next) => {
        if (alive) setUrl(next);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ref]);

  return url;
}

export async function uploadPrivate(file) {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  return file_uri;
}

export const profileOf = (me) => {
  if (!me) return {};
  if (me.data && typeof me.data === 'object') return { ...me, ...me.data };
  return me;
};
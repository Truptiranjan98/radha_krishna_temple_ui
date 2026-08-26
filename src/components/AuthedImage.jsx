import { useEffect, useState } from 'react';
import { api } from '../lib/api';

/**
 * /api/photos/{id}/file requires a bearer token, and a browser will not
 * attach one to an <img src>. So we pull the bytes through fetch and
 * render an object URL instead — revoking it on unmount so blobs don't
 * pile up in memory as the gallery scrolls.
 */
export default function AuthedImage({ photoId, alt, className = '' }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    setUrl(null);
    setFailed(false);

    api
      .photoBlobUrl(photoId)
      .then((u) => {
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        objectUrl = u;
        setUrl(u);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-paper text-xs text-muted ${className}`}
      >
        Image unavailable
      </div>
    );
  }

  if (!url) {
    return <div className={`animate-pulse bg-hairline ${className}`} />;
  }

  return <img src={url} alt={alt} loading="lazy" className={className} />;
}

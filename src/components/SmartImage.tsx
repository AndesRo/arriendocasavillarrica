import { useEffect, useState } from 'react';
import Placeholder from './Placeholder';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Carga prioritaria (solo para el Hero). */
  priority?: boolean;
  srcSet?: string;
  sizes?: string;
  placeholderLabel?: string;
  placeholderTone?: 'light' | 'dark';
}

/**
 * Imagen con lazy loading y respaldo automático:
 * si el archivo aún no existe, muestra un placeholder elegante en su lugar.
 */
export default function SmartImage({
  src,
  alt,
  className = '',
  priority = false,
  srcSet,
  sizes,
  placeholderLabel,
  placeholderTone = 'light',
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (failed) {
    return <Placeholder label={placeholderLabel} path={src} tone={placeholderTone} className={className} />;
  }

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={`${className} transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      {...({ fetchpriority: priority ? 'high' : 'auto' } as Record<string, string>)}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
  );
}

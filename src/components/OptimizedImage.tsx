import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio?: string; // e.g. '16/9', '4/3', '1/1', 'auto'
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
}

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

/**
 * Production-grade Image Component modeled after next/image
 * - Eliminates Cumulative Layout Shift (CLS) via aspect-ratio containers
 * - Native lazy loading with decoding="async"
 * - High priority loading with fetchpriority="high" for hero/LCP images
 * - Smooth skeleton shimmer placeholder until loaded
 * - Graceful fallback handling on image loading error
 * - WCAG 2.1 AA accessible with mandatory alt text
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  priority = false,
  aspectRatio = 'auto',
  fallbackSrc = DEFAULT_FALLBACK,
  className = '',
  containerClassName = '',
  ...restProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const finalSrc = hasError ? fallbackSrc : (src || fallbackSrc);

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${containerClassName}`}
      style={aspectRatio !== 'auto' ? { aspectRatio } : undefined}
    >
      {/* Shimmer skeleton while loading */}
      {!isLoaded && !hasError && (
        <div 
          aria-hidden="true" 
          className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse" 
        />
      )}

      <img
        src={finalSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        // @ts-ignore - Modern React supports fetchPriority
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...restProps}
      />
    </div>
  );
};

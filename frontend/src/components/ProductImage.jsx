import React, { useState, useEffect, useRef } from 'react';

export const ProductImage = React.memo(({
  src,
  alt = 'Product Image',
  testId,
  className = '',
  loading = 'lazy',
}) => {
  const [loaded, setLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef(null);

  const fallbackSrc = '/images/placeholder.svg';
  const displaySrc = isError || !src ? fallbackSrc : src;

  useEffect(() => {
    setIsError(false);
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setLoaded(true);
      } else if (imgRef.current.naturalWidth === 0 && !isError) {
        setIsError(true);
        setLoaded(true);
      }
    }
  }, [displaySrc, isError]);

  return (
    <div className={`img-wrapper ${loaded ? 'is-loaded' : 'is-loading'} ${className}`}>
      {!loaded && <div className="img-skeleton" aria-hidden="true" />}
      <img
        ref={imgRef}
        src={displaySrc}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!isError) {
            setIsError(true);
            setLoaded(true);
          }
        }}
        className={`product-img ${loaded ? 'img-visible' : 'img-hidden'}`}
        data-testid={testId}
        data-fallback={isError ? 'true' : 'false'}
      />
    </div>
  );
});

export default ProductImage;

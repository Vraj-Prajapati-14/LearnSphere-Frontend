import React, { useEffect, useRef } from 'react';

const LazyLoad = ({ onLoadMore, hasMore }) => {
  const observerRef = useRef(null);

  useEffect(() => {
    console.log('LazyLoad useEffect:', { hasMore });

    const observer = new IntersectionObserver(
      (entries) => {
        console.log('IntersectionObserver triggered:', {
          isIntersecting: entries[0].isIntersecting,
          hasMore,
        });
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, onLoadMore]);

  return (
    <div
      ref={observerRef}
      className="h-10 flex items-center justify-center text-gray-500"
    >
      {hasMore ? 'Loading more...' : 'No more items'}
    </div>
  );
};

export default LazyLoad;
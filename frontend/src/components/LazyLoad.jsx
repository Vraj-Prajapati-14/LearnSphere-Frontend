import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

const LazyLoad = ({ onLoadMore, hasMore, loadMoreButton = false, children }) => {
  const observerRef = useRef(null);
  const containerRef = useRef(null);

  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore) {
        onLoadMore();
      }
    },
    [hasMore, onLoadMore]
  );

  useEffect(() => {
    if (loadMoreButton || !hasMore) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [handleObserver, loadMoreButton, hasMore]);

  return (
    <div className="space-y-4">
      {children}
      {loadMoreButton && hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Load More
          </button>
        </div>
      )}
      <div ref={containerRef} className="h-1" />
    </div>
  );
};

LazyLoad.propTypes = {
  onLoadMore: PropTypes.func.isRequired,
  hasMore: PropTypes.bool.isRequired,
  loadMoreButton: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default LazyLoad;
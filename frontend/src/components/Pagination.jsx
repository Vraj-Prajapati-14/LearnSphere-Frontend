import React from 'react';

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasNext } = pagination;

  if (!pagination || (totalPages <= 1 && !hasNext)) {
    return null;
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      // console.log('Pagination click:', newPage);
      onPageChange(newPage);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-4 mt-8">
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
      >
        Previous
      </button>
      <span className="text-gray-700 font-medium">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={!hasNext}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
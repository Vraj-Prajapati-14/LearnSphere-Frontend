export default function EnrolledStudentsSection({
    enrollments,
    progressData,
    enrollmentsError,
    progressError,
    sortBy,
    sortOrder,
    handleSort,
    currentPage,
    pageSize,
    setCurrentPage,
    handleUnenrollStudent,
  }) {
    const sortedEnrollments = [...enrollments].sort((a, b) => {
      if (sortBy === 'progress') {
        const aProgress = progressData[a.id]?.overallProgress || 0;
        const bProgress = progressData[b.id]?.overallProgress || 0;
        return sortOrder === 'asc' ? aProgress - bProgress : bProgress - aProgress;
      }
      const aValue =
        sortBy === 'name'
          ? a.user?.name || a.user?.email || ''
          : sortBy === 'email'
          ? a.user?.email || ''
          : a.createdAt;
      const bValue =
        sortBy === 'name'
          ? b.user?.name || b.user?.email || ''
          : sortBy === 'email'
          ? b.user?.email || ''
          : b.createdAt;
  
      if (sortBy === 'createdAt') {
        return sortOrder === 'asc' ? new Date(aValue) - new Date(bValue) : new Date(bValue) - new Date(aValue);
      }
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  
    const totalPages = Math.ceil(enrollments.length / pageSize);
    const paginatedEnrollments = sortedEnrollments.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
    return (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Enrolled Students</h2>
        {enrollmentsError || progressError ? (
          <p className="text-red-500 rounded-md bg-red-50 p-2">{enrollmentsError || progressError}</p>
        ) : enrollments.length === 0 ? (
          <p className="text-gray-600">No students enrolled yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      Enrolled On {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('progress')}
                    >
                      Progress {sortBy === 'progress' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {enrollment.user?.name || enrollment.user?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {enrollment.user?.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {enrollment.createdAt
                          ? new Date(enrollment.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {progressData[enrollment.id]?.overallProgress != null
                          ? `${Math.round(progressData[enrollment.id].overallProgress)}%`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleUnenrollStudent(enrollment.id)}
                        >
                          Unenroll
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, enrollments.length)} of {enrollments.length}{' '}
                    students
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
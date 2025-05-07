import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Pagination = ({ pagination, onPageChange }) => {
  const { page, totalPages, hasNext } = pagination;

  if (!pagination || (totalPages <= 1 && !hasNext)) return null;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2 my-6">
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      <span className="text-gray-700">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={!hasNext}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
};

export default function Dashboard() {
  const { user, loading: authLoading, axiosAuth } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNext: false,
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'Instructor') {
      navigate('/login');
      return;
    }

    const loadInstructorCourses = async () => {
      try {
        setLoading(true);
        const response = await axiosAuth.get(
          `/courses?instructorId=${user.id}&page=${pagination.page}&limit=10`
        );

        setCourses(response.data.data.courses || []);
        setPagination({
          page: response.data.data.page || 1,
          totalPages: response.data.data.totalPages || 1,
          hasNext: response.data.data.hasNext || false,
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    loadInstructorCourses();
  }, [authLoading, user, navigate, pagination.page, axiosAuth]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (authLoading || loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {user.name} (Instructor)
          </h1>
          <button
            onClick={() => navigate(`/courses/add`)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700 transition duration-200"
          >
            + Create New Course
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Your Courses</h2>
          {courses.length === 0 ? (
            <p className="text-gray-600">No courses created yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white p-5 rounded-xl border shadow hover:shadow-md transition"
                >
                  <h3 className="text-lg font-bold text-gray-800">{course.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{course.description}</p>
                  <p className="text-sm mt-2">
                    <span className="font-medium text-gray-700">Status:</span>{' '}
                    <span
                      className={`font-semibold ${
                        course.isPublished ? 'text-green-600' : 'text-yellow-500'
                      }`}
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </p>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => navigate(`/courses/${course.id}/manage`)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Pagination pagination={pagination} onPageChange={handlePageChange} />
      </div>
    </div>
  );
}
import { useEffect, useState, Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-4 text-red-500">
          <p>Something went wrong: {this.state.error?.message || 'Unknown error'}</p>
          <p>Please try refreshing the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CourseManage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [error, setError] = useState('');
  const [enrollmentsError, setEnrollmentsError] = useState('');
  const [progressError, setProgressError] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchCourseData = async () => {
    try {
      // Fetch course details
      const { data } = await axios.get(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setCourse(data.data);

      // Fetch sessions
      const res = await axios.get(`${API_URL}/courses/${courseId}/sessions`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSessions(Array.isArray(res.data.data) ? res.data.data : []);

      // Fetch enrollments
      const enrollmentsRes = await axios.get(`${API_URL}/enrollments`, {
        params: { courseId },
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const enrollmentData = enrollmentsRes.data.data;
      if (Array.isArray(enrollmentData)) {
        setEnrollments(enrollmentData);
      } else if (enrollmentData && typeof enrollmentData === 'object') {
        setEnrollments([enrollmentData]);
      } else {
        console.warn('Enrollments data is invalid:', enrollmentData);
        setEnrollments([]);
        setEnrollmentsError('Invalid enrollments data received');
      }

      // Fetch progress (instructor gets all students' progress)
      const progressRes = await axios.get(`${API_URL}/progress/course/${courseId}/progress`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const progressDataResult = progressRes.data.data;
      if (Array.isArray(progressDataResult)) {
        // Instructor response: Array of { enrollmentId, userId, overallProgress }
        const progressMap = progressDataResult.reduce((acc, item) => {
          acc[item.enrollmentId] = item;
          return acc;
        }, {});
        setProgressData(progressMap);
      } else if (progressDataResult?.overallProgress != null) {
        // Student response: Single object with overallProgress
        console.warn('Received student progress as instructor; expected array');
        setProgressError('Invalid progress data for instructor view');
      } else {
        console.warn('Progress data is invalid:', progressDataResult);
        setProgressError('Invalid progress data received');
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
      if (err.response?.status === 403) {
        setError('Unauthorized: You are not the instructor of this course');
      } else {
        setError(err.response?.data?.error || 'Failed to load course data');
      }
      if (err.response?.config?.url?.includes('enrollments')) {
        setEnrollmentsError(err.response?.data?.error || 'Failed to load enrollments');
        setEnrollments([]);
      }
      if (err.response?.config?.url?.includes('progress')) {
        setProgressError(err.response?.data?.error || 'Failed to load progress data');
      }
    }
  };

  useEffect(() => {
    if (user && user.token) {
      fetchCourseData();
    } else {
      setError('Please log in to manage courses');
    }
  }, [courseId, user]);

  const handleDeleteSession = async (sessionId) => {
    try {
      await axios.delete(`${API_URL}/courses/${courseId}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSessions(sessions.filter((s) => s.id !== sessionId));
      alert('Session deleted successfully');
    } catch (err) {
      alert('Error deleting session');
    }
  };

  const handleDeleteCourse = async () => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this course?');
      if (!confirmDelete) return;

      await axios.delete(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      alert('Course deleted successfully');
      navigate('/dashboard');
    } catch (err) {
      alert('Error deleting course');
    }
  };

  const handleUnenrollStudent = async (enrollmentId) => {
    try {
      const confirmUnenroll = window.confirm('Are you sure you want to unenroll this student?');
      if (!confirmUnenroll) return;

      await axios.delete(`${API_URL}/enrollments/${enrollmentId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setEnrollments(enrollments.filter((e) => e.id !== enrollmentId));
      setProgressData((prev) => {
        const newProgress = { ...prev };
        delete newProgress[enrollmentId];
        return newProgress;
      });
      setCurrentPage(1);
      alert('Student unenrolled successfully');
    } catch (err) {
      alert('Error unenrolling student');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Sort and paginate enrollments
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
    <ErrorBoundary>
      <div className="max-w-5xl mx-auto p-6">
        {/* Error Display */}
        {error && <p className="text-red-500 text-center p-4 mb-4 rounded-md bg-red-50">{error}</p>}

        {/* Loading State */}
        {!course && !error && <p className="text-gray-600 text-center p-4">Loading...</p>}

        {course && (
          <>
            {/* Course Header */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{course.title}</h1>
              <p className="text-gray-600 mb-4">{course.description || 'No description available'}</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate(`/courses/${courseId}/edit`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
                >
                  Edit Course
                </button>
                <button
                  onClick={() => navigate(`/courses/${courseId}/add-session`)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-300"
                >
                  Add Session
                </button>
                <button
                  onClick={handleDeleteCourse}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-300"
                >
                  Delete Course
                </button>
              </div>
            </div>

            {/* Sessions Section */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sessions</h2>
              {sessions.length === 0 ? (
                <p className="text-gray-600">No sessions yet.</p>
              ) : (
                <ul className="space-y-4">
                  {sessions.map((session) => (
                    <li
                      key={session.id}
                      className="bg-gray-50 p-4 rounded-md shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div>
                        <h3 className="text-lg font-medium text-gray-800">{session.title}</h3>
                        <a
                          href={session.youtubeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-sm"
                        >
                          {session.youtubeLink}
                        </a>
                        <p className="text-sm text-gray-600 mt-1">{session.explanation}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition duration-300"
                          onClick={() => navigate(`/courses/${courseId}/sessions/${session.id}/edit`)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition duration-300"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Enrolled Students Section */}
            <div className="bg-white shadow-md rounded-lg p-6">
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
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
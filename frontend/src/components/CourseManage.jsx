import { useEffect, useState, Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import CourseHeader from './CourseHeader.jsx';
import SessionsSection from './SessionsSection.jsx';
import EnrolledStudentsSection from './EnrolledStudentsSection.jsx';
import ReviewSection from './ReviewSection.jsx';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl w-full mx-4 p-6 bg-red-50 rounded-xl shadow-lg text-red-600 font-medium text-center">
          <p className="font-semibold">Something went wrong:</p>
          <p>{this.state.error?.message || 'Unknown error'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function CourseManage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, loading, axiosAuth } = useAuth();
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
    setError('');
    setEnrollmentsError('');
    setProgressError('');
    try {
      const [courseRes, sessionsRes, enrollmentsRes, progressRes] = await Promise.all([
        axiosAuth.get(`/courses/${courseId}`),
        axiosAuth.get(`/courses/${courseId}/sessions`),
        axiosAuth.get(`/enrollments`, { params: { courseId } }),
        axiosAuth.get(`/progress/course/${courseId}/progress`),
      ]);

      setCourse(courseRes.data.data);

      const sessionData = Array.isArray(sessionsRes.data.data.sessions) ? sessionsRes.data.data.sessions : [];
      setSessions(sessionData.filter((s) => s.id && !isNaN(Number(s.id))));

      const enrollmentData = enrollmentsRes.data.data;
      setEnrollments(Array.isArray(enrollmentData) ? enrollmentData : enrollmentData ? [enrollmentData] : []);

      const progress = progressRes.data.data;
      if (Array.isArray(progress)) {
        const progressMap = progress.reduce((acc, item) => {
          acc[item.enrollmentId] = item;
          return acc;
        }, {});
        setProgressData(progressMap);
      } else {
        setProgressError('Invalid progress data received');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load course data';
      setError(
        err.response?.status === 401 ? 'Please log in' :
        err.response?.status === 403 ? 'Unauthorized access' :
        err.response?.status === 404 ? 'Course not found' :
        err.response?.status === 500 ? 'Server error. Try again later.' : msg
      );
      if (err.response?.status === 401) navigate('/login');
    }
  };

  useEffect(() => {
    if (!loading && user) {
      fetchCourseData();
    }
  }, [courseId, user, loading]);

  const handleDeleteSession = async (sessionId) => {
    try {
      await axiosAuth.delete(`/courses/${courseId}/sessions/${sessionId}`);
      await fetchCourseData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete session');
      if (err.response?.status === 401) navigate('/login');
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await axiosAuth.delete(`/courses/${courseId}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete course');
      if (err.response?.status === 401) navigate('/login');
    }
  };

  const handleUnenrollStudent = async (enrollmentId) => {
    if (!window.confirm('Unenroll this student?')) return;
    try {
      await axiosAuth.delete(`/enrollments/${enrollmentId}`);
      setEnrollments(enrollments.filter(e => e.id !== enrollmentId));
      setProgressData(prev => {
        const newProgress = { ...prev };
        delete newProgress[enrollmentId];
        return newProgress;
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unenroll student');
      if (err.response?.status === 401) navigate('/login');
    }
  };

  const handleSort = (field) => {
    setSortBy(prev => field);
    setSortOrder(prev => sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="max-w-2xl w-full mx-4 p-6 bg-red-50 rounded-xl shadow-lg text-red-600 font-medium text-center mb-6">
              {error}
            </div>
          )}
          {loading && (
            <div className="flex justify-center items-center min-h-screen text-gray-700 text-xl font-medium animate-pulse">
              Loading...
            </div>
          )}
          {!loading && course && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300">
                <CourseHeader course={course} courseId={courseId} handleDeleteCourse={handleDeleteCourse} />
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300">
                <SessionsSection
                  sessions={sessions}
                  courseId={courseId}
                  handleDeleteSession={handleDeleteSession}
                />
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300">
                <EnrolledStudentsSection
                  enrollments={enrollments}
                  progressData={progressData}
                  enrollmentsError={enrollmentsError}
                  progressError={progressError}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  handleSort={handleSort}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  setCurrentPage={setCurrentPage}
                  handleUnenrollStudent={handleUnenrollStudent}
                />
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300">
                <ReviewSection courseId={courseId} user={user} />
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
import { useEffect, useState, Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import CourseHeader from './CourseHeader.jsx';
import SessionsSection from './SessionsSection.jsx';
import EnrolledStudentsSection from './EnrolledStudentsSection.jsx';
import ReviewSection from './ReviewSection.jsx';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-4 text-red-500 bg-red-100 rounded-md">
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
    try {
      const { data: courseData } = await axiosAuth.get(`/courses/${courseId}`);
      console.log('Course data:', courseData);
      setCourse(courseData.data);

      const sessionsRes = await axiosAuth.get(`/courses/${courseId}/sessions`);
      console.log('Sessions data:', sessionsRes.data);
      setSessions(Array.isArray(sessionsRes.data.data) ? sessionsRes.data.data : []);

      const enrollmentsRes = await axiosAuth.get(`/enrollments`, {
        params: { courseId },
      });
      console.log('Enrollments data:', enrollmentsRes.data);
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

      const progressRes = await axiosAuth.get(`/progress/course/${courseId}/progress`);
      console.log('Progress data:', progressRes.data);
      const progressDataResult = progressRes.data.data;
      if (Array.isArray(progressDataResult)) {
        const progressMap = progressDataResult.reduce((acc, item) => {
          acc[item.enrollmentId] = item;
          return acc;
        }, {});
        setProgressData(progressMap);
      } else if (progressDataResult?.overallProgress != null) {
        console.warn('Received student progress as instructor; expected array');
        setProgressError('Invalid progress data for instructor view');
      } else {
        console.warn('Progress data is invalid:', progressDataResult);
        setProgressError('Invalid progress data received');
      }
    } catch (err) {
      console.error('Error fetching course data:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.response?.config?.url,
      });
      if (err.response?.status === 403) {
        setError('Unauthorized: You are not the instructor of this course');
      } else if (err.response?.status === 404) {
        setError('Course not found');
      } else if (err.response?.status === 500) {
        setError('Server error: Failed to load course data. Please try again later.');
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
    if (loading) return;
    if (user) {
      console.log('CourseManage user:', user);
      fetchCourseData();
    } else {
      setError('Please log in to manage courses');
      navigate('/login');
    }
  }, [courseId, user, loading, navigate]);

  const handleDeleteSession = async (sessionId) => {
    try {
      const response = await axiosAuth.delete(`/courses/${courseId}/sessions/${sessionId}`);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      alert(response.data.message || 'Session deleted successfully');
    } catch (err) {
      console.error('Error deleting session:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.response?.config?.url,
      });
      const errorMessage =
        err.response?.status === 403
          ? 'Unauthorized: You are not the instructor of this course'
          : err.response?.status === 404
          ? 'Session not found'
          : err.response?.status === 500
          ? 'Server error: Failed to delete session. Please try again later.'
          : err.response?.data?.error || 'Failed to delete session';
      setError(errorMessage);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this course? This action cannot be undone.');
      if (!confirmDelete) return;

      const response = await axiosAuth.delete(`/courses/${courseId}`);
      alert(response.data.message || 'Course deleted successfully');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting course:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.response?.config?.url,
      });
      const errorMessage =
        err.response?.status === 403
          ? 'Unauthorized: You are not the instructor of this course'
          : err.response?.status === 404
          ? 'Course not found'
          : err.response?.status === 500
          ? 'Server error: Failed to delete course. Please try again later.'
          : err.response?.data?.error || 'Failed to delete course';
      setError(errorMessage);
    }
  };

  const handleUnenrollStudent = async (enrollmentId) => {
    try {
      const confirmUnenroll = window.confirm('Are you sure you want to unenroll this student?');
      if (!confirmUnenroll) return;

      const response = await axiosAuth.delete(`/enrollments/${enrollmentId}`);
      setEnrollments(enrollments.filter((e) => e.id !== enrollmentId));
      setProgressData((prev) => {
        const newProgress = { ...prev };
        delete newProgress[enrollmentId];
        return newProgress;
      });
      setCurrentPage(1);
      alert(response.data.message || 'Student unenrolled successfully');
    } catch (err) {
      console.error('Error unenrolling student:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMessage =
        err.response?.status === 403
          ? 'Unauthorized: You cannot unenroll this student'
          : err.response?.status === 404
          ? 'Enrollment not found'
          : err.response?.data?.error || 'Failed to unenroll student';
      setError(errorMessage);
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

  return (
    <ErrorBoundary>
      <div className="max-w-5xl mx-auto p-6 bg-gray-50 dark:bg-gray-800 min-h-screen">
        {error && (
          <p className="text-red-500 text-center p-4 mb-4 rounded-md bg-red-100 dark:bg-red-800/30 dark:text-red-200">
            {error}
          </p>
        )}

        {!course && !error && (
          <p className="text-gray-600 dark:text-gray-200 text-center p-4">Loading...</p>
        )}

        {course && (
          <>
            <CourseHeader
              course={course}
              courseId={courseId}
              handleDeleteCourse={handleDeleteCourse}
            />
            <SessionsSection
              sessions={sessions}
              courseId={courseId}
              handleDeleteSession={handleDeleteSession}
            />
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
            <ReviewSection courseId={courseId} user={user} />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
import { useEffect, useState, Component } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
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
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchCourseData = async () => {
    try {
      const { data: courseData } = await axios.get(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setCourse(courseData.data);

      const sessionsRes = await axios.get(`${API_URL}/courses/${courseId}/sessions`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSessions(Array.isArray(sessionsRes.data.data) ? sessionsRes.data.data : []);

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

      const progressRes = await axios.get(`${API_URL}/progress/course/${courseId}/progress`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
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

  return (
    <ErrorBoundary>
      <div className="max-w-5xl mx-auto p-6">
        {error && <p className="text-red-500 text-center p-4 mb-4 rounded-md bg-red-50">{error}</p>}

        {!course && !error && <p className="text-gray-600 text-center p-4">Loading...</p>}

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
            <ReviewSection courseId={courseId} user={user} token={user.token} />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewSection from './ReviewSection.jsx';

export default function CourseProgress() {
  const { user, loading: authLoading } = useAuth();
  const [courseProgress, setCourseProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { courseId } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchCourseProgress = async () => {
    try {
      const response = await axios.get(`${API_URL}/progress/course/${courseId}/progress`, {
        withCredentials: true,
      });
      const { progress = [], sessions = [], overallProgress = 0 } = response.data.data;
      const sessionsWithProgress = sessions.map((session) => ({
        ...session,
        isCompleted: progress.some((p) => p.sessionId === session.id && p.isCompleted),
      }));
      setCourseProgress({ overallProgress });
      setSessions(sessionsWithProgress);
    } catch (err) {
      console.error('API Error:', err.response ? err.response.data : err.message);
      setError(err.response?.data?.error || 'Failed to fetch course progress');
    } finally {
      setLoading(false);
    }
  };

  const markSessionComplete = async (sessionId) => {
    try {
      await axios.post(
        `${API_URL}/progress`,
        { sessionId, isCompleted: true },
        {   withCredentials: true, }
      );
      fetchCourseProgress();
    } catch (err) {
      console.error('Error marking session complete:', err.response?.data || err.message);
      setError('Failed to update progress');
    }
  };

  useEffect(() => {
    if (user) {
      fetchCourseProgress();
    }
  }, [user, courseId]);

  if (authLoading || loading) return <div className="text-center p-4 text-gray-600">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500 bg-red-100 rounded-md">{error}</div>;
  if (!courseProgress) return <div className="text-center p-4 text-gray-600">No course progress data available.</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-md p-6 rounded-lg mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Course Progress</h2>

      {/* Progress Bar */}
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Overall Progress: {courseProgress.overallProgress}%</p>
        <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${courseProgress.overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Sessions List */}
      <h4 className="text-lg font-medium text-gray-800 mb-4">Sessions</h4>
      <ul className="space-y-4">
        {sessions.length === 0 ? (
          <li className="text-gray-600">No sessions available.</li>
        ) : (
          sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-col sm:flex-row justify-between items-start gap-4 p-4 border border-gray-200 rounded-md bg-gray-50"
            >
              <div className="flex-1">
                <h5 className="text-lg font-semibold text-gray-800 mb-1">{session.title}</h5>
                <p className="text-blue-600 underline">
                  <a href={session.youtubeLink} target="_blank" rel="noopener noreferrer">
                    Watch Video
                  </a>
                </p>
                <div
                  className="text-sm text-gray-600 mt-1 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: session.explanation }}
                ></div>
                <p className="text-sm text-gray-600 mt-1">
                  {session.isCompleted ? '✅ Completed' : '⏳ Not completed'}
                </p>
              </div>
              {!session.isCompleted && (
                <button
                  onClick={() => markSessionComplete(session.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                >
                  Mark as Complete
                </button>
              )}
            </li>
          ))
        )}
      </ul>

      {/* Review Section */}
      <ReviewSection courseId={courseId} user={user} token={user.token} />

      <div className="mt-6">
        <button
          onClick={() => navigate('/enrolled-courses')}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition"
        >
          Back to Enrolled Courses
        </button>
      </div>
    </div>
  );
}
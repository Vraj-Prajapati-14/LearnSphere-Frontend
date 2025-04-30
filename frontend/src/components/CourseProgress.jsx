import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useParams, useNavigate } from 'react-router-dom';

export default function CourseProgress() {
  const { user, loading: authLoading } = useAuth();
  const [courseProgress, setCourseProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { courseId } = useParams();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch course progress and sessions
  const fetchCourseProgress = async () => {
    try {
      const response = await axios.get(`${API_URL}/progress/course/${courseId}/progress`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const { progress = [], sessions = [], overallProgress = 0 } = response.data.data;

      // Merge progress info into session data
      const sessionsWithProgress = sessions.map((session) => {
        const matched = progress.find((p) => p.sessionId === session.id);
        return {
          ...session,
          isCompleted: matched?.isCompleted || false,
        };
      });

      setCourseProgress({ overallProgress });
      setSessions(sessionsWithProgress);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.response?.data?.error || 'Failed to fetch course progress');
    } finally {
      setLoading(false);
    }
  };

  const markSessionComplete = async (sessionId) => {
    try {
      // Create or update progress record with isCompleted: true
      await axios.post(
        `${API_URL}/progress`,
        { sessionId, isCompleted: true },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Refresh progress
      await fetchCourseProgress();
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

  // Loading, error, and no data states
  if (authLoading || loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;
  if (!courseProgress) return <div>No course progress data available.</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white shadow p-6 rounded-lg mt-6">
      <h2 className="text-2xl font-bold mb-4">Course Progress</h2>

      {/* Progress Bar */}
      <div className="mb-6">
        <p>Overall Progress: {courseProgress.overallProgress}%</p>
        <div className="progress-bar bg-gray-200 rounded-full h-4">
          <div
            className="progress-bar-fill bg-blue-500 h-full rounded-full"
            style={{ width: `${courseProgress.overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Sessions List */}
      <h4 className="font-medium mb-4">Sessions</h4>
      <ul className="space-y-4">
        {sessions.length === 0 ? (
          <li>No sessions available.</li>
        ) : (
          sessions.map((session) => (
            <li key={session.id} className="flex justify-between items-start gap-4 p-4 border rounded">
              <div className="flex-1">
                <h5 className="font-semibold mb-1">{session.title}</h5>
                <p className="text-blue-600 underline">
                  <a href={session.youtubeLink} target="_blank" rel="noopener noreferrer">
                    Watch Video
                  </a>
                </p>
                <p className="mt-1 text-gray-700">{session.explanation}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {session.isCompleted ? '✅ Completed' : '⏳ Not completed'}
                </p>
              </div>

              {!session.isCompleted && (
                <button
                  onClick={() => markSessionComplete(session.id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded self-start"
                >
                  Mark as Complete
                </button>
              )}
            </li>
          ))
        )}
      </ul>

      <div className="mt-6">
        <button
          onClick={() => navigate('/enrolled-courses')}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Back to Enrolled Courses
        </button>
      </div>
    </div>
  );
}
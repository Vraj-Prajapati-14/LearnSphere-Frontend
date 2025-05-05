import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import ReviewSection from './ReviewSection.jsx';

export default function CourseProgress() {
  const { user, loading: authLoading, axiosAuth } = useAuth();
  const [courseProgress, setCourseProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoVisibility, setVideoVisibility] = useState({});
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Extract YouTube video ID for thumbnail and embed URL
  const getYouTubeThumbnail = (url) => {
    const videoId = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : null;
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoId = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const fetchCourseProgress = async () => {
    try {
      const response = await axiosAuth.get(`/progress/course/${courseId}/progress`);
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
      await axiosAuth.post(`/progress`, { sessionId, isCompleted: true });
      fetchCourseProgress();
    } catch (err) {
      console.error('Error marking session complete:', err.response?.data || err.message);
      setError('Failed to update progress');
    }
  };

  const toggleVideoVisibility = (sessionId) => {
    setVideoVisibility((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  useEffect(() => {
    if (user) {
      fetchCourseProgress();
    } else if (!authLoading) {
      navigate('/login');
    }
  }, [user, authLoading, courseId, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-800">
        <div className="text-gray-600 dark:text-gray-200 text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center p-4 text-red-500 bg-red-100 dark:bg-red-800/30 dark:text-red-200 rounded-md shadow">
          {error}
        </div>
      </div>
    );
  }

  if (!courseProgress) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center p-4 text-gray-600 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-md shadow">
          No course progress data available.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 dark:bg-gray-800 min-h-screen">
      <div className="bg-white dark:bg-gray-700 shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Course Progress</h2>

        {/* Progress Bar */}
        <div className="mb-8">
          <p className="text-gray-700 dark:text-gray-200 mb-2 text-lg font-medium">
            Overall Progress: {courseProgress.overallProgress.toFixed(2)}%
          </p>
          <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-5 overflow-hidden">
            <div
              className="bg-blue-500 dark:bg-blue-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${courseProgress.overallProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Sessions List */}
        <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Sessions</h4>
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <div className="text-gray-600 dark:text-gray-200 text-center p-4 bg-white dark:bg-gray-700 rounded-md shadow">
              No sessions available.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Thumbnail */}
                  {getYouTubeThumbnail(session.youtubeLink) && (
                    <div className="flex-shrink-0">
                      <img
                        src={getYouTubeThumbnail(session.youtubeLink)}
                        alt={`${session.title} thumbnail`}
                        className="w-48 h-27 object-cover rounded-md shadow-sm"
                      />
                    </div>
                  )}
                  {/* Session Details */}
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      {session.title}
                    </h5>
                    <div className="flex items-center gap-4 mb-3">
                      <a
                        href={session.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-300 font-medium hover:text-blue-700 dark:hover:text-blue-200 transition"
                      >
                        Watch Video
                      </a>
                      <button
                        onClick={() => toggleVideoVisibility(session.id)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                          videoVisibility[session.id]
                            ? 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700'
                            : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                        }`}
                      >
                        {videoVisibility[session.id] ? 'Cancel' : 'Show Video'}
                      </button>
                    </div>
                    <div
                      className="text-gray-600 dark:text-gray-200 prose dark:prose-invert max-w-none mb-3"
                      dangerouslySetInnerHTML={{ __html: session.explanation || 'No explanation provided.' }}
                    ></div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-300">
                      {session.isCompleted ? '✅ Completed' : '⏳ Not completed'}
                    </p>
                  </div>
                  {/* Action Button */}
                  {!session.isCompleted && (
                    <div className="self-start md:self-center">
                      <button
                        onClick={() => markSessionComplete(session.id)}
                        className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition font-medium"
                      >
                        Mark as Complete
                      </button>
                    </div>
                  )}
                </div>
                {/* Embedded Video */}
                {videoVisibility[session.id] && getYouTubeEmbedUrl(session.youtubeLink) && (
                  <div className="mt-4">
                    <iframe
                      className="w-full h-64 md:h-80 rounded-md"
                      src={getYouTubeEmbedUrl(session.youtubeLink)}
                      title={`${session.title} video`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Review Section */}
        <div className="mt-8">
          <ReviewSection courseId={courseId} user={user} />
        </div>
      </div>
    </div>
  );
}
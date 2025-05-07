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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-gray-600 text-xl font-medium animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="max-w-2xl w-full mx-4 p-6 bg-red-50 rounded-xl shadow-lg text-center text-red-600 font-medium">
          {error}
        </div>
      </div>
    );
  }

  if (!courseProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="max-w-2xl w-full mx-4 p-6 bg-white rounded-xl shadow-lg text-center text-gray-600 font-medium">
          No course progress data available.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Course Progress</h2>

     
        <div className="mb-10">
          <p className="text-lg font-semibold text-gray-700 mb-3">
            Overall Progress: {courseProgress.overallProgress.toFixed(2)}%
          </p>
          <div className="relative bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${courseProgress.overallProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-20"></div>
            </div>
          </div>
        </div>


        <h4 className="text-2xl font-semibold text-gray-800 mb-6">Sessions</h4>
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <div className="text-gray-600 text-center p-6 bg-gray-50 rounded-xl shadow-sm">
              No sessions available.
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white border border-gray-200 rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row gap-6">
             
                  {getYouTubeThumbnail(session.youtubeLink) && (
                    <div className="flex-shrink-0 w-full lg:w-48">
                      <img
                        src={getYouTubeThumbnail(session.youtubeLink)}
                        alt={`${session.title} thumbnail`}
                        className="w-full h-32 lg:h-27 object-cover rounded-lg shadow-sm hover:opacity-90 transition-opacity duration-200"
                      />
                    </div>
                  )}
           
                  <div className="flex-1">
                    <h5 className="text-xl font-semibold text-gray-800 mb-3">{session.title}</h5>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <a
                        href={session.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200"
                      >
                        Watch Video
                      </a>
                      <button
                        onClick={() => toggleVideoVisibility(session.id)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ${
                          videoVisibility[session.id]
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {videoVisibility[session.id] ? 'Hide Video' : 'Show Video'}
                      </button>
                    </div>
                    <div
                      className="text-gray-600 prose max-w-none mb-4"
                      dangerouslySetInnerHTML={{ __html: session.explanation || 'No explanation provided.' }}
                    ></div>
                    <p className="text-sm font-medium text-gray-500">
                      {session.isCompleted ? '✅ Completed' : '⏳ Not completed'}
                    </p>
                  </div>
            
                  {!session.isCompleted && (
                    <div className="self-start lg:self-center">
                      <button
                        onClick={() => markSessionComplete(session.id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium shadow-sm"
                      >
                        Mark as Complete
                      </button>
                    </div>
                  )}
                </div>
                {videoVisibility[session.id] && getYouTubeEmbedUrl(session.youtubeLink) && (
                  <div className="mt-6">
                    <iframe
                      className="w-full h-64 sm:h-80 lg:h-96 rounded-lg shadow-inner"
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

        <div className="mt-10">
          <ReviewSection courseId={courseId} user={user} />
        </div>
      </div>
    </div>
  );
}
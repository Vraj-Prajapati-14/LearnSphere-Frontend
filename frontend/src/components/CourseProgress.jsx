import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useParams, useNavigate } from 'react-router-dom';

export default function CourseProgress() {
  const { user, loading: authLoading } = useAuth();
  const [courseProgress, setCourseProgress] = useState(null);
  const [sessions, setSessions] = useState([]);
  const[s,setS]=useState([]);
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
      console.log('API Response:', response.data); // Debug log to see the full response structure
      setCourseProgress(response.data); // Assuming the overall progress is here
      setSessions(response.data.progress || []);
      setS(response.data.data.sessions);
    //   console.log(response.data.data.sessions[0]);
       // Assuming 'progress' contains session progress
    } catch (err) {
      console.error('API Error:', err); // Debug log to see errors
      setError(err.response?.data?.error || 'Failed to fetch course progress');
    } finally {
      setLoading(false);
    }
  };

  const markSessionComplete = async (sessionId) => {
    try {
      // Check if progress exists for this session
      const res = await axios.get(`${API_URL}/progress/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
  
      // Update existing progress
      const progressId = res.data.id;
      await axios.put(
        `${API_URL}/progress/${progressId}`,
        { isCompleted: true },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
    } catch (err) {
      // If progress doesn't exist, create a new one
      if (err.response?.status === 404) {
        await axios.post(
          `${API_URL}/progress`,
          {
            sessionId, // this is correct — must be sent in body
            isCompleted: true,
          },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
      } else {
        console.error('Error updating/creating progress:', err);
        return;
      }
    }
  
    fetchCourseProgress(); // Refresh data after updating
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
      <h3 className="text-xl mb-4">{courseProgress.title}</h3>

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
  {s.length === 0 ? (
    <li>No sessions available.</li>
  ) : (
    s.map((session) => (
      <li key={session.id} className="flex justify-between items-start gap-4 p-4 border rounded">
        <div className="flex-1">
          <h5 className="font-semibold mb-1">Session #{session.id}</h5>
          <p className="text-blue-600 underline">
            <a href={session.youtubeLink} target="_blank" rel="noopener noreferrer">
              Watch Video
            </a>
          </p>
          <p className="mt-1 text-gray-700">{session.explanation}</p>
          <p className="text-sm text-gray-600 mt-1">
            {session.progress
              ? `Progress: ${session.progress.isCompleted ? '✅ Completed' : '⏳ In Progress'}`
              : '⏳ Not started'}
          </p>
        </div>

        {!session.progress?.isCompleted && (
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
          onClick={() => navigate('/enrolled-courses')} // Use navigate instead of history
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Back to Enrolled Courses
        </button>
      </div>
    </div>
  );
}

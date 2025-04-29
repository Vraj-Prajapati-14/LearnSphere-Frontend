import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function CourseManage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setCourse(data.data);

      const res = await axios.get(`${API_URL}/courses/${courseId}/sessions`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSessions(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load course data');
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const handleDeleteSession = async (sessionId) => {
    try {
      await axios.delete(`${API_URL}/courses/${courseId}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSessions(sessions.filter(s => s.id !== sessionId));
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
      navigate('/dashboard');  // Navigate back to the course list or any other page
    } catch (err) {
      alert('Error deleting course');
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!course) return <p>Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{course.title}</h1>
      <p className="text-gray-600 mb-4">{course.description}</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => navigate(`/courses/${courseId}/edit`)} className="bg-blue-600 text-white px-4 py-2 rounded-md">Edit Course</button>
        <button onClick={() => navigate(`/courses/${courseId}/add-session`)} className="bg-green-600 text-white px-4 py-2 rounded-md">Add Session</button>
        <button onClick={handleDeleteCourse} className="bg-red-600 text-white px-4 py-2 rounded-md">Delete Course</button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Sessions</h2>
      {sessions.length === 0 ? (
        <p>No sessions yet.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map(session => (
            <li key={session.id} className="bg-white p-4 rounded-md shadow flex justify-between items-center">
              <div>
                <h3 className="font-medium">{session.title}</h3>
                <h3 className="font-medium">{session.youtubeLink}</h3>

                <p className="text-sm text-gray-600">{session.explanation}</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => navigate(`/courses/${courseId}/sessions/${session.id}/edit`)}>Edit</button>
                <button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => handleDeleteSession(session.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

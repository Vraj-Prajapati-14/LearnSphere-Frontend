import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import TiptapEditor from './TiptapEditor.jsx';

export default function SessionForm() {
  const { courseId, sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [title, setTitle] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [editor, setEditor] = useState(null); 

  const isEditMode = Boolean(sessionId);

  const fetchSessionData = async () => {
    if (!sessionId) return;
    try {
      const response = await axios.get(`${API_URL}/courses/${courseId}/sessions/${sessionId}`, {
        withCredentials: true,
      });
      const data = response.data.data;
      setTitle(data.title);
      setYoutubeLink(data.youtubeLink);
      setExplanation(data.explanation || '<p></p>'); 
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch session data');
    }
  };

  useEffect(() => {
    if (isEditMode) fetchSessionData();
  }, [isEditMode]);

  useEffect(() => {
    if (editor && explanation) {
      editor.commands.setContent(explanation);
    }
  }, [editor, explanation]);

  useEffect(() => {
    if (youtubeLink) {
      const id = extractVideoIdFromUrl(youtubeLink);
      if (id) setThumbnailUrl(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
    } else {
      setThumbnailUrl('');
    }
  }, [youtubeLink]);

  const extractVideoIdFromUrl = (url) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return url.match(regex) ? url.match(regex)[1] : null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = { title, youtubeLink, explanation };

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/courses/${courseId}/sessions/${sessionId}`, payload, {
          withCredentials: true,
        });
      } else {
        await axios.post(`${API_URL}/courses/${courseId}/sessions`, payload, {
          withCredentials: true,
        });
      }
      navigate(`/courses/${courseId}/manage`);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">
          {isEditMode ? 'Edit Session' : 'Create New Session'}
        </h1>

        {error && (
          <p className="text-red-600 bg-red-50 p-3 rounded-lg mb-6 text-sm">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">YouTube Link</label>
            <input
              type="text"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              required
            />
          </div>

          {thumbnailUrl && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">Video Thumbnail</label>
              <img
                src={thumbnailUrl}
                alt="Thumbnail"
                className="rounded-lg w-full h-auto shadow-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-2">Explanation</label>
            <TiptapEditor content={explanation} onUpdate={setExplanation} setEditor={setEditor} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Session' : 'Create Session')}
          </button>
        </form>
      </div>
    </div>
  );
}
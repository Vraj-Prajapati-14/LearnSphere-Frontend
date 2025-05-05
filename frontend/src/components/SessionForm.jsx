import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

import '@tiptap/extension-text-style';
import 'prosemirror-view/style/prosemirror.css';

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
      setExplanation(data.explanation);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch session data');
    }
  };

  useEffect(() => {
    if (isEditMode) fetchSessionData();
  }, [isEditMode]);

  useEffect(() => {
    if (youtubeLink) {
      const id = extractVideoIdFromUrl(youtubeLink);
      if (id) setThumbnailUrl(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
    }
  }, [youtubeLink]);

  const extractVideoIdFromUrl = (url) => {
    const regex = /(?:youtube\.com\/(?:[^/]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return url.match(regex) ? url.match(regex)[1] : null;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: explanation,
    onUpdate: ({ editor }) => {
      setExplanation(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && explanation !== editor.getHTML()) {
      editor.commands.setContent(explanation);
    }
  }, [editor, explanation]);

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

  if (!editor) return null;

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">
          {isEditMode ? 'Edit Session' : 'Create New Session'}
        </h1>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">YouTube Link</label>
            <input
              type="text"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {thumbnailUrl && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">Video Thumbnail</label>
              <img src={thumbnailUrl} alt="Thumbnail" className="rounded-md w-full h-auto" />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-2">Explanation</label>

            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { label: 'Bold', action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive('bold') },
                { label: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive('italic') },
                { label: 'Underline', action: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive('underline') },
                { label: 'H1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive('heading', { level: 1 }) },
                { label: 'H2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive('heading', { level: 2 }) },
                { label: 'List', action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive('bulletList') },
                { label: 'Code', action: () => editor.chain().focus().toggleCodeBlock().run(), isActive: editor.isActive('codeBlock') },
                {
                  label: 'Link',
                  action: () => {
                    const url = prompt('Enter URL');
                    if (url) editor.chain().focus().setLink({ href: url }).run();
                    else editor.chain().focus().unsetLink().run();
                  },
                  isActive: editor.isActive('link'),
                },
              ].map(({ label, action, isActive }) => (
                <button
                  type="button"
                  key={label}
                  onClick={action}
                  className={`px-3 py-1 text-sm rounded-md border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="border border-gray-300 rounded-md p-3 min-h-[150px] prose max-w-none bg-white">
              <EditorContent editor={editor} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 transition"
          >
            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Session' : 'Create Session')}
          </button>
        </form>
      </div>
    </div>
  );
}

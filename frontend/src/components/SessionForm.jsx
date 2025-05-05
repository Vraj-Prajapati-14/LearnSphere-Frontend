import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

// Import ProseMirror styles
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
      const response = await axios.get(
        `${API_URL}/courses/${courseId}/sessions/${sessionId}`,
        {
          withCredentials: true,

        }
      );
      const sessionData = response.data.data;
      setTitle(sessionData.title);
      setYoutubeLink(sessionData.youtubeLink);
      setExplanation(sessionData.explanation);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch session data');
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchSessionData();
    }
  }, [isEditMode, courseId, sessionId]);

  useEffect(() => {
    if (youtubeLink) {
      const videoId = extractVideoIdFromUrl(youtubeLink);
      if (videoId) {
        setThumbnailUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
      }
    }
  }, [youtubeLink]);

  const extractVideoIdFromUrl = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return url.match(regex) ? url.match(regex)[1] : null;
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: explanation,
    onUpdate: ({ editor }) => {
      setExplanation(editor.getHTML());
    },
  });

  // Sync editor content when explanation changes (e.g., during edit mode)
  useEffect(() => {
    if (editor && explanation !== editor.getHTML()) {
      editor.commands.setContent(explanation);
    }
  }, [editor, explanation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title,
        youtubeLink,
        explanation,
      };

      let response;

      if (isEditMode) {
        response = await axios.put(
          `${API_URL}/courses/${courseId}/sessions/${sessionId}`,
          payload,
          {
            withCredentials: true,
            
          }
        );
      } else {
        response = await axios.post(
          `${API_URL}/courses/${courseId}/sessions`,
          payload,
          {
            withCredentials: true,

          }
        );
      }

      navigate(`/courses/${courseId}/manage`);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!editor) {
    return null; // Prevent rendering until editor is initialized
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-md shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">{isEditMode ? 'Edit Session' : 'Create Session'}</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">YouTube Link</label>
            <input
              type="text"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              required
            />
          </div>

          {thumbnailUrl && (
            <div className="mb-4">
              <label className="block font-medium mb-1">Video Thumbnail</label>
              <img
                src={thumbnailUrl}
                alt="YouTube Video Thumbnail"
                className="w-full h-auto rounded-md"
              />
            </div>
          )}

          <div>
            <label className="block font-medium mb-1">Explanation</label>

            <div className="flex gap-2 mb-2 flex-wrap">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-3 py-1 border rounded-md ${
                  editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                Bold
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-3 py-1 border rounded-md ${
                  editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                Italic
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`px-3 py-1 border rounded-md ${
                  editor.isActive('underline') ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                Underline
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`px-3 py-1 border rounded-md ${
                  editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                H1
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-3 py-1 border rounded-md ${
                  editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                H2
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-3 py-1 border rounded-md ${
                  editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                Bullet List
              </button>

              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter the URL');
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  } else {
                    editor.chain().focus().unsetLink().run();
                  }
                }}
                className={`px-3 py-1 border rounded-md ${
                  editor.isActive('link') ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                Link
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`px-3 py-1 border rounded-md ${
                  editor.isActive('codeBlock') ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                Code Block
              </button>
            </div>

            <div className="border rounded-md p-2 min-h-[150px] prose">
              <EditorContent editor={editor} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Session' : 'Create Session')}
          </button>
        </form>
      </div>
    </div>
  );
}
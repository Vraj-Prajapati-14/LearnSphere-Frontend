// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext.jsx';

// export default function SessionForm() {
//   const { courseId, sessionId } = useParams(); // Get sessionId from URL params
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const API_URL = import.meta.env.VITE_API_URL;

//   const [title, setTitle] = useState('');
//   const [youtubeLink, setYoutubeLink] = useState('');
//   const [explanation, setExplanation] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   // If sessionId exists, it's an edit mode; otherwise, it's create mode
//   const isEditMode = Boolean(sessionId);

//   const fetchSessionData = async () => {
//     if (!sessionId) return; // If no sessionId, skip the fetch

//     try {
//       const response = await axios.get(
//         `${API_URL}/courses/${courseId}/sessions/${sessionId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${user.token}`,
//           },
//         }
//       );
//       const sessionData = response.data.data;
//       setTitle(sessionData.title);
//       setYoutubeLink(sessionData.youtubeLink);
//       setExplanation(sessionData.explanation);
//     } catch (err) {
//       setError(err.response?.data?.error || 'Failed to fetch session data');
//     }
//   };

//   useEffect(() => {
//     if (isEditMode) {
//       fetchSessionData(); // Fetch session data if editing
//     }
//   }, [isEditMode, courseId, sessionId]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       const payload = {
//         title,
//         youtubeLink,
//         explanation,
//       };

//       let response;

//       if (isEditMode) {
//         // Update session
//         response = await axios.put(
//           `${API_URL}/courses/${courseId}/sessions/${sessionId}`,
//           payload,
//           {
//             headers: {
//               Authorization: `Bearer ${user.token}`,
//             },
//           }
//         );
//       } else {
//         // Create session
//         response = await axios.post(
//           `${API_URL}/courses/${courseId}/sessions`,
//           payload,
//           {
//             headers: {
//               Authorization: `Bearer ${user.token}`,
//             },
//           }
//         );
//       }

//       // After success, navigate back to the dashboard or manage page
//       navigate(`/courses/${courseId}/manage`);
//     } catch (err) {
//       setError(err.response?.data?.error || 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">
//       <div className="bg-white p-6 rounded-md shadow-md w-full max-w-lg">
//         <h2 className="text-2xl font-bold mb-4">{isEditMode ? 'Edit Session' : 'Create Session'}</h2>

//         {error && <p className="text-red-500 mb-4">{error}</p>}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block font-medium mb-1">Title</label>
//             <input
//               type="text"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//               className="w-full border px-3 py-2 rounded-md"
//               required
//             />
//           </div>

//           <div>
//             <label className="block font-medium mb-1">YouTube Link</label>
//             <input
//               type="text"
//               value={youtubeLink}
//               onChange={(e) => setYoutubeLink(e.target.value)}
//               className="w-full border px-3 py-2 rounded-md"
//               required
//             />
//           </div>

//           <div>
//             <label className="block font-medium mb-1">Explanation</label>
//             <textarea
//               value={explanation}
//               onChange={(e) => setExplanation(e.target.value)}
//               className="w-full border px-3 py-2 rounded-md"
//               rows={5}
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
//           >
//             {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Session' : 'Create Session')}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }


import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

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
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
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
    const match = url.match(regex);
    return match ? match[1] : null;
  };

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
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
      } else {
        response = await axios.post(
          `${API_URL}/courses/${courseId}/sessions`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
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

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: explanation,
    onUpdate: ({ editor }) => {
      setExplanation(editor.getHTML());
    },
  });

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

            {editor && (
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`px-3 py-1 border rounded-md ${editor.isActive('bold') ? 'bg-blue-500 text-white' : ''}`}
                >
                  Bold
                </button>

                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`px-3 py-1 border rounded-md ${editor.isActive('italic') ? 'bg-blue-500 text-white' : ''}`}
                >
                  Italic
                </button>

                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`px-3 py-1 border rounded-md ${editor.isActive('underline') ? 'bg-blue-500 text-white' : ''}`}
                >
                  Underline
                </button>

                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={`px-3 py-1 border rounded-md ${editor.isActive('heading') ? 'bg-blue-500 text-white' : ''}`}
                >
                  H1
                </button>

                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={`px-3 py-1 border rounded-md ${editor.isActive('heading') ? 'bg-blue-500 text-white' : ''}`}
                >
                  H2
                </button>

                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`px-3 py-1 border rounded-md ${editor.isActive('bulletList') ? 'bg-blue-500 text-white' : ''}`}
                >
                  Bullet List
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url = prompt('Enter the URL');
                    if (url) {
                      editor.chain().focus().setLink({ href: url }).run();
                    }
                  }}
                  className="px-3 py-1 border rounded-md"
                >
                  Link
                </button>

                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={`px-3 py-1 border rounded-md ${editor.isActive('codeBlock') ? 'bg-blue-500 text-white' : ''}`}
                >
                  Code Block
                </button>
              </div>
            )}

            <div className="border rounded-md p-2 min-h-[150px]">
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

import { useNavigate } from 'react-router-dom';

export default function SessionsSection({ sessions, courseId, handleDeleteSession }) {
  const navigate = useNavigate();

  const getYouTubeVideoId = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v');
      } else if (urlObj.hostname.includes('youtu.be')) {
        return urlObj.pathname.slice(1);
      }
    } catch (err) {
      console.error('Invalid YouTube URL:', url, err);
      return null;
    }
    return null;
  };

  const getYouTubeThumbnail = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : null;
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sessions</h2>
      {sessions.length === 0 ? (
        <p className="text-gray-600">No sessions yet.</p>
      ) : (
        <ul className="space-y-4">
          {sessions.map((session) => {
            const thumbnailUrl = getYouTubeThumbnail(session.youtubeLink);
            return (
              <li
                key={session.id}
                className="bg-gray-50 p-4 rounded-md shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {thumbnailUrl ? (
                    <a
                      href={session.youtubeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-32 h-18"
                    >
                      <img
                        src={thumbnailUrl}
                        alt={`${session.title} thumbnail`}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </a>
                  ) : (
                    <div className="w-32 h-18 bg-gray-200 rounded-md flex items-center justify-center">
                      <p className="text-gray-500 text-sm">No thumbnail</p>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">{session.title}</h3>
                    <a
                      href={session.youtubeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      {session.youtubeLink}
                    </a>
                    <div
                      className="text-sm text-gray-600 mt-1 prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: session.explanation }}
                    ></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition"
                    onClick={() => navigate(`/courses/${courseId}/sessions/${session.id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    Delete
                  </button>
                </div>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses/${id}/details`);
      setCourse(response.data.data);
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err.response?.data?.error || 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (loading) return <div className="text-center p-4 text-gray-600">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;
  if (!course) return <div className="text-center p-4 text-gray-600">Course not found.</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Breadcrumb */}
      <nav className="bg-white shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ol className="flex space-x-2 text-sm text-gray-500">
            <li><Link to="/" className="hover:text-blue-500">Home</Link></li>
            <li>/</li>
            <li className="text-gray-700">{course.title}</li>
          </ol>
        </div>
      </nav>

   
      <section className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-gray-600 mb-4">{course.description || 'No description available'}</p>
              <p className="text-sm text-gray-500 mb-1">Category: {course.category?.name || 'Uncategorized'}</p>
              <p className="text-sm text-gray-500 mb-1">Status: {course.isPublished ? 'Published' : 'Draft'}</p>
              <p className="text-sm text-gray-500">Created: {new Date(course.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </section>

 
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold mb-6">Sessions</h2>
        {course.sessions?.length === 0 ? (
          <p className="text-gray-600">No sessions available for this course.</p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-6">
            {course.sessions.map((session) => {
              const youtubeId = getYouTubeId(session.youtubeLink);
              return (
                <li
                  key={session.id}
                  className="bg-blue-50 border border-blue-200 p-6 rounded-xl shadow-sm hover:shadow-md transition duration-300"
                >
                  <div className="space-y-4">
                
                    {youtubeId && (
                      <div className="aspect-w-16 aspect-h-9">
                        <iframe
                          className="rounded-lg w-full"
                          src={`https://www.youtube.com/embed/${youtubeId}`}
                          title={session.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}

                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{session.title}</h3>
                      <div
                        className="prose max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: session.explanation }}
                      />
                      <div className="mt-2">
                        <a
                          href={session.youtubeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-sm text-blue-600 hover:underline"
                        >
                          📺 Watch on YouTube
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default CourseDetails;

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar.jsx';

export default function EnrolledCourses() {
  const { user, loading: authLoading } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchEnrolledCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/enrollments`, {
        withCredentials: true,
      });

      const courses = response.data.data.map((enrollment) => enrollment.course);
      setEnrolledCourses(courses);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchEnrolledCourses();
  }, [user]);

  useEffect(() => {
    const handleEnrollmentChange = () => {
      fetchEnrolledCourses();
    };
    window.addEventListener('courseEnrolled', handleEnrollmentChange);
    return () => {
      window.removeEventListener('courseEnrolled', handleEnrollmentChange);
    };
  }, []);

  const categories = ['all', ...new Set(enrolledCourses.map((course) => course.category?.name).filter(Boolean))];

  const filteredCourses = enrolledCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || course.category?.name === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category) => {
    const colors = [
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-amber-100 text-amber-800',
    ];
    const index = category ? (category.charCodeAt(0) % colors.length) : 0;
    return colors[index];
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-300">
        <div className="text-gray-700 text-xl font-medium animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">
        <div className="max-w-2xl w-full mx-4 p-6 bg-red-50 rounded-xl shadow-lg text-center text-red-600 font-medium">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-10">My Enrolled Courses</h1>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-gray-700 placeholder-gray-400 transition-all duration-200"
              />
            </div>
            <div className="w-full sm:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-gray-700 transition-all duration-200"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-xl shadow-lg text-gray-600 font-medium">
              No courses match your search or filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  onClick={() => navigate(`/course/${course.id}/progress`)}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-xl font-semibold text-gray-800">{course.title}</h2>
                      {course.category?.name && (
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(
                            course.category.name
                          )}`}
                        >
                          {course.category.name}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
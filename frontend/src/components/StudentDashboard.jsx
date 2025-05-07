import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from './Navbar.jsx';
import Pagination from './Pagination.jsx';

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNext: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `${API_URL}/courses?page=${pagination.page}&limit=10`,
          { withCredentials: true }
        );
        console.log('Courses response:', response.data);
        setCourses(response.data.data.courses || []);
        setPagination({
          page: response.data.data.page || 1,
          totalPages: response.data.data.totalPages || 1,
          hasNext: response.data.data.hasNext || false,
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) fetchCourses();
  }, [API_URL, user, authLoading, pagination.page]);

  const handleEnroll = async (courseId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/enrollments`,
        { courseId },
        { withCredentials: true }
      );
      setCourses((prevCourses) => prevCourses.filter((course) => course.id !== courseId));
      alert('Enrolled successfully!');
      window.dispatchEvent(new Event('courseEnrolled'));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to enroll');
    }
  };

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const categories = ['all', ...new Set(courses.map((course) => course.category?.name).filter(Boolean))];

  const filteredCourses = courses.filter((course) => {
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

  if (loading || authLoading) {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-10">Explore Courses</h1>

          {/* Search and Filter */}
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
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  onClick={() => handleCourseClick(course.id)}
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnroll(course.id);
                    }}
                    className="mt-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-sm"
                  >
                    Enroll Now
                  </button>
                </div>
              ))}
            </div>
          )}
          <Pagination
            pagination={pagination}
            onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
          />
        </div>
      </div>
    </>
  );
}
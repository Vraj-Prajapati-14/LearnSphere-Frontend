import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Pagination from '../components/Pagination.jsx';

const LandingPage = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    total: 0,
    totalPages: 0,
    hasNext: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const coursesRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchCourses = async (page = 1) => {
    try {
      setLoading(true);
      console.log('Fetching courses for page:', page);
      const response = await axios.get(`${API_URL}/courses/allcourse`, {
        params: { page, limit: pagination.limit },
        withCredentials: true,
      });
      const { remainingCourses, pagination: newPagination } = response.data.data || {};
      console.log('Fetched courses:', { page, remainingCourses: remainingCourses?.length || 0, newPagination });
      setCourses(remainingCourses);

      setPagination(newPagination || {
        page: 1,
        limit: 6,
        total: 0,
        totalPages: 0,
        hasNext: false,
      });

      const uniqueCategories = [
        ...new Set(remainingCourses.map((course) => course.category?.name).filter(Boolean)),
      ];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching courses:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(1);
  }, []);

  const handlePageChange = (newPage) => {
    console.log('Page change triggered:', newPage);
    fetchCourses(newPage);
    if (coursesRef.current) {
      coursesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory
      ? course.category?.name === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to LearnSphere
          </h1>
          <p className="text-lg md:text-xl mb-6">
            Your one-stop platform for learning and teaching.
          </p>
          <p className="text-md md:text-lg mb-8">
            Explore a variety of courses, enroll, and learn with experts from various fields.
          </p>
        </div>
      </section>

      <section ref={coursesRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {loading && courses.length === 0 ? (
          <div className="text-center text-gray-600">Loading courses...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center text-gray-600">No courses found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300"
                >
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{course.description}</p>
                    <p className="text-sm text-gray-500 mb-2">
                      Category: {course.category?.name || 'Uncategorized'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Status: {course.isPublished ? 'Published' : 'Draft'}
                    </p>
                    <Link
                      to={`/courses/${course.id}`}
                      className="inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </>
        )}
      </section>
    </div>
  );
};

export default LandingPage;
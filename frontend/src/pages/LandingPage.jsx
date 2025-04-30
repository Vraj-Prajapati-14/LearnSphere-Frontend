import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses/allcourse`);
      console.log(response);
      
      const { remainingCourses } = response.data.data;
      setCourses(remainingCourses);

      // Extract unique categories from courses
      const uniqueCategories = [
        ...new Set(remainingCourses.map((course) => course.category?.name).filter(Boolean)),
      ];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.error || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses based on search query and selected category
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory
      ? course.category?.name === selectedCategory
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section */}
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
          <Link
            to="/signup"
            className="inline-block bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg shadow hover:bg-gray-200 transition duration-300"
          >
            Join Today
          </Link>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center text-gray-600">Loading courses...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center text-gray-600">No courses found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300"
              >
                <img
                  src={course.image || 'https://via.placeholder.com/300x200'}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
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
        )}
      </section>
    </div>
  );
};

export default LandingPage;
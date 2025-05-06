import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import 'animate.css';
import { FaUser, FaBook, FaSort } from 'react-icons/fa';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export default function InstructorStatistics() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [filteredStats, setFilteredStats] = useState([]);
  const [studentProgress, setStudentProgress] = useState([]);
  const [filteredStudentProgress, setFilteredStudentProgress] = useState([]);
  const [overallStats, setOverallStats] = useState({
    totalCourses: 0,
    totalSessions: 0,
    enrolledStudents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState({ enrollments: '', progress: '' });
  const [sortBy, setSortBy] = useState('title');
  const [studentSortBy, setStudentSortBy] = useState('enrollmentCount');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'Instructor') {
      navigate('/login');
      return;
    }

    const fetchInstructorStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/courses`, {
          withCredentials: true,
        });
        const courses = response.data.data || [];

        // Compute course-level stats and student progress
        const statsData = [];
        const studentProgressMap = {};

        await Promise.all(
          courses.map(async (course) => {
            const progressResponse = await axios.get(`${API_URL}/progress/course/${course.id}/progress`, {
              withCredentials: true,
            });
            const progressData = progressResponse.data.data;

            const totalEnrollments = progressData.length;
            const totalSessions = course.sessions.length;
            const completedSessions = progressData.reduce((sum, p) => sum + (p.overallProgress > 0 ? 1 : 0), 0);
            const overallProgress = totalEnrollments > 0 ? (completedSessions / totalEnrollments) * 100 : 0;

            statsData.push({
              courseId: course.id,
              title: course.title,
              totalEnrollments,
              totalSessions,
              overallProgress,
              createdAt: course.createdAt,
              updatedAt: course.updatedAt,
            });

            // Aggregate student progress
            progressData.forEach((enrollment) => {
              const studentId = enrollment.userId;
              if (!studentProgressMap[studentId]) {
                studentProgressMap[studentId] = {
                  userId: studentId,
                  name: enrollment.user.name,
                  email: enrollment.user.email,
                  courses: [],
                  enrollmentCount: 0,
                  totalProgress: 0,
                };
              }
              studentProgressMap[studentId].courses.push({
                courseId: course.id,
                courseTitle: course.title,
                progress: enrollment.overallProgress * 100,
              });
              studentProgressMap[studentId].enrollmentCount += 1;
              studentProgressMap[studentId].totalProgress += enrollment.overallProgress * 100;
            });
          })
        );

        // Calculate average progress for each student
        const studentProgressData = Object.values(studentProgressMap).map((student) => ({
          ...student,
          averageProgress: student.enrollmentCount > 0 ? student.totalProgress / student.enrollmentCount : 0,
        }));

        setStats(statsData);
        setFilteredStats(statsData);
        setStudentProgress(studentProgressData);
        setFilteredStudentProgress(studentProgressData);

        const totalCourses = courses.length;
        const totalSessions = courses.reduce((sum, course) => sum + course.sessions.length, 0);
        const enrolledStudents = studentProgressData;

        setOverallStats({
          totalCourses,
          totalSessions,
          enrolledStudents,
        });
      } catch (err) {
        console.error('fetchInstructorStats - Error:', {
          message: err.message,
          response: JSON.stringify(err.response?.data, null, 2),
          status: err.response?.status,
        });
        setError(err.response?.data?.message || 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorStats();
  }, [authLoading, user, navigate, API_URL]);

  // Handle search, filter, and sort for courses
  useEffect(() => {
    let result = [...stats];

    if (searchQuery) {
      result = result.filter((stat) =>
        stat.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filter.enrollments) {
      const enrollments = parseInt(filter.enrollments, 10);
      result = result.filter((stat) => stat.totalEnrollments >= enrollments);
    }
    if (filter.progress) {
      const progress = parseInt(filter.progress, 10);
      result = result.filter((stat) => stat.overallProgress >= progress);
    }

    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'enrollments') return b.totalEnrollments - a.totalEnrollments;
      if (sortBy === 'progress') return b.overallProgress - a.overallProgress;
      if (sortBy === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

    setFilteredStats(result);
  }, [searchQuery, filter, sortBy, stats]);

  // Handle filter and sort for students
  useEffect(() => {
    let result = [...studentProgress];

    if (filter.progress) {
      const progress = parseInt(filter.progress, 10);
      result = result.filter((student) => student.averageProgress >= progress);
    }

    result.sort((a, b) => {
      if (studentSortBy === 'enrollmentCount') return b.enrollmentCount - a.enrollmentCount;
      if (studentSortBy === 'averageProgress') return b.averageProgress - a.averageProgress;
      if (studentSortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    setFilteredStudentProgress(result);
  }, [filter.progress, studentSortBy, studentProgress]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setStats([]);
    setStudentProgress([]);
  };

  const toggleStudentDetails = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-4 animate__animated animate__pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-4 text-red-500 animate__animated animate__fadeIn">
          <p>{error}</p>
          <button
            onClick={handleRetry}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Pie chart data for enrollment distribution
  const pieChartData = {
    labels: stats.map((stat) => stat.title),
    datasets: [
      {
        data: stats.map((stat) => stat.totalEnrollments),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  // Line chart data for progress trends
  const lineChartData = {
    labels: stats.map((stat) => new Date(stat.updatedAt).toLocaleDateString()),
    datasets: [
      {
        label: 'Overall Progress (%)',
        data: stats.map((stat) => stat.overallProgress),
        fill: false,
        borderColor: '#36A2EB',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate__animated animate__fadeIn">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FaUser className="mr-2 text-blue-600" /> Instructor Statistics, {user.name}
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300 flex items-center"
          >
            Logout
          </button>
        </div>

        {/* Overall Statistics Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 animate__animated animate__fadeIn animate__delay-1s">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaBook className="mr-2 text-green-600" /> Overall Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-100 p-4 rounded-lg transform hover:scale-105 transition duration-300">
              <p className="text-lg font-medium text-blue-800">Total Courses</p>
              <p className="text-3xl font-bold text-blue-900">{overallStats.totalCourses}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg transform hover:scale-105 transition duration-300">
              <p className="text-lg font-medium text-green-800">Total Sessions</p>
              <p className="text-3xl font-bold text-green-900">{overallStats.totalSessions}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg transform hover:scale-105 transition duration-300">
              <p className="text-lg font-medium text-purple-800">Unique Students</p>
              <p className="text-3xl font-bold text-purple-900">{overallStats.enrolledStudents.length}</p>
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Enrollment Distribution</h3>
            <div className="w-full h-64">
              <Pie
                data={pieChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                }}
              />
            </div>
          </div>
        </div>

        {/* Filters and Search Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 animate__animated animate__fadeIn animate__delay-2s">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaSort className="mr-2 text-blue-600" /> Filter & Sort
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Courses</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by course title..."
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Enrollments</label>
              <select
                value={filter.enrollments}
                onChange={(e) => setFilter({ ...filter, enrollments: e.target.value })}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="10">10+</option>
                <option value="20">20+</option>
                <option value="50">50+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Progress (%)</label>
              <select
                value={filter.progress}
                onChange={(e) => setFilter({ ...filter, progress: e.target.value })}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="25">25%+</option>
                <option value="50">50%+</option>
                <option value="75">75%+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Courses By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="title">Title</option>
                <option value="enrollments">Enrollments</option>
                <option value="progress">Progress</option>
                <option value="createdAt">Created Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Enrolled Students Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8 animate__animated animate__fadeIn animate__delay-3s">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaUser className="mr-2 text-purple-600" /> Enrolled Students
          </h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Students By</label>
            <select
              value={studentSortBy}
              onChange={(e) => setStudentSortBy(e.target.value)}
              className="w-full md:w-1/4 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="enrollmentCount">Enrollment Count</option>
              <option value="averageProgress">Average Progress</option>
              <option value="name">Name</option>
            </select>
          </div>
          {filteredStudentProgress.length === 0 ? (
            <p className="text-gray-600">No students match the current filters.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudentProgress.map((student) => (
                <div
                  key={student.userId}
                  className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 animate__animated animate__fadeInUp"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaUser className="text-purple-600 mr-2" />
                      <h3 className="text-lg font-medium text-gray-800">{student.name}</h3>
                    </div>
                    <button
                      onClick={() => toggleStudentDetails(student.userId)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      {expandedStudent === student.userId ? 'Hide' : 'Details'}
                    </button>
                  </div>
                  <p className="text-gray-600 mt-1">{student.email}</p>
                  <p className="text-gray-600 mt-1">Enrollments: {student.enrollmentCount}</p>
                  <div className="mt-2">
                    <p className="text-gray-600">Avg. Progress: {student.averageProgress.toFixed(1)}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${student.averageProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  {expandedStudent === student.userId && (
                    <div className="mt-4 animate__animated animate__fadeIn">
                      <h4 className="text-md font-medium text-gray-800 mb-2">Enrolled Courses</h4>
                      {student.courses.length === 0 ? (
                        <p className="text-gray-600">No courses enrolled.</p>
                      ) : (
                        <ul className="space-y-2">
                          {student.courses.map((course) => (
                            <li key={course.courseId} className="bg-white p-2 rounded-lg shadow-sm">
                              <p className="text-gray-800">{course.courseTitle}</p>
                              <p className="text-gray-600">Progress: {course.progress.toFixed(1)}%</p>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${course.progress}%` }}
                                ></div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Statistics Section */}
        <div className="animate__animated animate__fadeIn animate__delay-4s">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
            <FaBook className="mr-2 text-green-600" /> Course Statistics
          </h2>
          {filteredStats.length === 0 ? (
            <p className="text-gray-600">No courses match the current filters.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStats.map((stat) => {
                const barChartData = {
                  labels: ['Enrollments', 'Completed Sessions'],
                  datasets: [
                    {
                      label: 'Statistics',
                      data: [
                        stat.totalEnrollments,
                        Math.round(stat.overallProgress / 100) * stat.totalEnrollments,
                      ],
                      backgroundColor: ['#3498db', '#2ecc71'],
                    },
                  ],
                };

                return (
                  <div
                    key={stat.courseId}
                    className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300 animate__animated animate__fadeInUp"
                  >
                    <h3 className="text-lg font-medium text-gray-800 mb-2">{stat.title}</h3>
                    <p className="mb-2 text-gray-600">Enrollments: {stat.totalEnrollments}</p>
                    <p className="mb-2 text-gray-600">Sessions: {stat.totalSessions}</p>
                    <p className="mb-2 text-gray-600">
                      Created: {new Date(stat.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mb-4">
                      <p className="text-gray-600">Progress: {stat.overallProgress.toFixed(1)}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${stat.overallProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-full h-48">
                      <Bar
                        data={barChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: { y: { beginAtZero: true } },
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Progress Trend Section */}
        {stats.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-lg mt-8 animate__animated animate__fadeIn animate__delay-5s">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Progress Trends</h2>
            <div className="w-full h-64">
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: { beginAtZero: true, max: 100 },
                    x: { title: { display: true, text: 'Last Updated' } },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
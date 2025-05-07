import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import 'animate.css';
import StatsOverview from './StatsOverview.jsx';
import StudentList from './StudentList.jsx';

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
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

        const courses = response.data.data?.courses || [];
        if (!Array.isArray(courses)) {
          throw new Error('Courses data is not an array');
        }

        const statsData = [];
        const studentProgressMap = {};

        await Promise.all(
          courses.map(async (course) => {
            try {
              const progressResponse = await axios.get(`${API_URL}/progress/course/${course.id}/progress`, {
                withCredentials: true,
              });
              const progressData = progressResponse.data.data || [];

              const totalEnrollments = progressData.length;
              const totalSessions = course.sessions?.length || 0;

              const totalCompletedSessions = progressData.reduce(
                (sum, p) => sum + (p.overallProgress > 0 ? p.overallProgress * totalSessions : 0),
                0
              );
              const overallProgress = totalEnrollments > 0 && totalSessions > 0
                ? (totalCompletedSessions / (totalEnrollments * totalSessions)) * 100
                : 0;

              statsData.push({
                courseId: course.id,
                title: course.title,
                totalEnrollments,
                totalSessions,
                overallProgress,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt,
              });

              progressData.forEach((enrollment) => {
                const studentId = enrollment.userId;
                const studentProgress = enrollment.overallProgress * 100; 

                if (!studentProgressMap[studentId]) {
                  studentProgressMap[studentId] = {
                    userId: studentId,
                    name: enrollment.user?.name || 'Unknown',
                    email: enrollment.user?.email || 'N/A',
                    courses: [],
                    enrollmentCount: 0,
                    totalProgress: 0,
                    totalSessions: 0,
                  };
                }

                studentProgressMap[studentId].courses.push({
                  courseId: course.id,
                  courseTitle: course.title,
                  progress: studentProgress,
                  totalSessions: totalSessions,
                });
                studentProgressMap[studentId].enrollmentCount += 1;
                studentProgressMap[studentId].totalProgress += studentProgress;
                studentProgressMap[studentId].totalSessions += totalSessions;
              });
            } catch (err) {
              console.error(`Error fetching progress for course ${course.id}:`, {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status,
              });
            }
          })
        );

        const studentProgressData = Object.values(studentProgressMap).map((student) => ({
          ...student,
          averageProgress: student.enrollmentCount > 0 ? student.totalProgress / student.enrollmentCount : 0,
        }));

        setStats(statsData);
        setFilteredStats(statsData);
        setStudentProgress(studentProgressData);
        setFilteredStudentProgress(studentProgressData);

        const totalCourses = courses.length;
        const totalSessions = courses.reduce((sum, course) => sum + (course.sessions?.length || 0), 0);
        const enrolledStudents = studentProgressData;

        setOverallStats({
          totalCourses,
          totalSessions,
          enrolledStudents,
        });
      } catch (err) {
        console.error('fetchInstructorStats - Detailed Error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          stack: err.stack,
        });
        setError(err.response?.data?.message || err.message || 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorStats();
  }, [authLoading, user, navigate, API_URL]);

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

    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'enrollments') return b.totalEnrollments - a.totalEnrollments;
      if (sortBy === 'progress') return b.overallProgress - a.overallProgress;
      if (sortBy === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0;
    });

    setFilteredStats(result);
  }, [searchQuery, filter, sortBy, stats]);

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
        <div className="text-center p-4 animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-4 text-red-500 animate-fade-in">
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
       
        <StatsOverview
          overallStats={overallStats}
          stats={stats}
          filteredStats={filteredStats}
          setFilteredStats={setFilteredStats}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filter={filter}
          setFilter={setFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        <StudentList
          filteredStudentProgress={filteredStudentProgress}
          expandedStudent={expandedStudent}
          toggleStudentDetails={toggleStudentDetails}
          studentSortBy={studentSortBy}
          setStudentSortBy={setStudentSortBy}
          filter={filter}
          setFilter={setFilter}
        />
      </div>
    </div>
  );
}
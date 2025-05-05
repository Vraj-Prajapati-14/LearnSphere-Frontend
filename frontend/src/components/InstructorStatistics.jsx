import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function InstructorStatistics() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [overallStats, setOverallStats] = useState({
    totalCourses: 0,
    totalSessions: 0,
    enrolledStudents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    // Redirect if user is not an Instructor
    if (user.role !== 'Instructor') {
      navigate('/login'); // or navigate('/unauthorized')
      return;
    }

    const fetchInstructorStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/courses`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const courses = response.data.data || [];

        // Compute course-level stats
        const statsData = await Promise.all(
          courses.map(async (course) => {
            const progressResponse = await axios.get(`${API_URL}/progress/course/${course.id}/progress`, {
              headers: { Authorization: `Bearer ${user.token}` },
            });
            const progressData = progressResponse.data.data;

            const totalEnrollments = progressData.length;
            const totalSessions = course.sessions.length;
            const completedSessions = progressData.reduce((sum, p) => sum + (p.overallProgress > 0 ? 1 : 0), 0);
            const overallProgress = totalEnrollments > 0 ? (completedSessions / totalEnrollments) * 100 : 0;

            return {
              courseId: course.id,
              title: course.title,
              totalEnrollments,
              totalSessions,
              overallProgress,
              createdAt: course.createdAt,
              updatedAt: course.updatedAt,
            };
          })
        );

        setStats(statsData);

        // Compute overall stats
        const totalCourses = courses.length;
        const totalSessions = courses.reduce((sum, course) => sum + course.sessions.length, 0);

        // Aggregate enrolled students across all courses
        const allEnrollments = await Promise.all(
          courses.map(async (course) => {
            const progressResponse = await axios.get(`${API_URL}/progress/course/${course.id}/progress`, {
              headers: { Authorization: `Bearer ${user.token}` },
            });
            return progressResponse.data.data.map((enrollment) => ({
              userId: enrollment.userId,
              name: enrollment.user.name,
              email: enrollment.user.email,
            }));
          })
        );

        // Flatten and deduplicate students, counting their enrollments
        const studentMap = {};
        allEnrollments.flat().forEach((student) => {
          if (!studentMap[student.userId]) {
            studentMap[student.userId] = {
              userId: student.userId,
              name: student.name,
              email: student.email,
              enrollmentCount: 0,
            };
          }
          studentMap[student.userId].enrollmentCount += 1;
        });

        const enrolledStudents = Object.values(studentMap);

        setOverallStats({
          totalCourses,
          totalSessions,
          enrolledStudents,
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructorStats();
  }, [authLoading, user, navigate, API_URL]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (authLoading || loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            Instructor Statistics, {user.name}
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Overall Statistics Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Overall Statistics</h2>
          <div className="grid gap-4">
            <div>
              <p className="text-lg">
                Total Courses Created: {overallStats.totalCourses}
              </p>
              <p className="text-lg">
                Total Sessions Across All Courses: {overallStats.totalSessions}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Enrolled Students</h3>
              {overallStats.enrolledStudents.length === 0 ? (
                <p className="text-gray-600">No students enrolled yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border p-2 text-left">Name</th>
                        <th className="border p-2 text-left">Email</th>
                        <th className="border p-2 text-left">Courses Enrolled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overallStats.enrolledStudents.map((student) => (
                        <tr key={student.userId} className="border-b">
                          <td className="border p-2">{student.name}</td>
                          <td className="border p-2">{student.email}</td>
                          <td className="border p-2">{student.enrollmentCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course-Level Statistics Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Course Statistics</h2>
          {stats.length === 0 ? (
            <p className="text-gray-600">No courses or data available.</p>
          ) : (
            <div className="grid gap-6">
              {stats.map((stat) => {
                const chartData = {
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
                  <div key={stat.courseId} className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-medium mb-2">{stat.title}</h3>
                    <p className="mb-2">Total Enrollments: {stat.totalEnrollments}</p>
                    <p className="mb-2">Total Sessions: {stat.totalSessions}</p>
                    <p className="mb-2">
                      Created At: {new Date(stat.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mb-2">
                      Updated At: {new Date(stat.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="mb-4">
                      <p>Overall Progress: {stat.overallProgress.toFixed(1)}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-500 h-4 rounded-full"
                          style={{ width: `${stat.overallProgress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-full h-64">
                      <Bar
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
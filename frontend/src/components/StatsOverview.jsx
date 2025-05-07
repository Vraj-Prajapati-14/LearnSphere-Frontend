import { Pie, Bar, Line } from 'react-chartjs-2';
import { FaBook, FaSort } from 'react-icons/fa';

const StatsOverview = ({ overallStats, stats, filteredStats, setFilteredStats, searchQuery, setSearchQuery, filter, setFilter, sortBy, setSortBy }) => {
 
  const pieChartData = {
    labels: stats.map((stat) => stat.title),
    datasets: [
      {
        data: stats.map((stat) => stat.totalEnrollments),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  const lineChartData = {
    labels: stats.map((stat) => new Date(stat.updatedAt).toLocaleDateString()),
    datasets: [
      {
        label: 'Average Progress (%)',
        data: stats.map((stat) => stat.overallProgress),
        fill: false,
        borderColor: '#36A2EB',
        tension: 0.1,
      },
    ],
  };

  return (
    <>
    
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8 animate-fade-in-up">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <FaBook className="mr-2 text-green-600" /> Overall Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-100 p-4 rounded-lg hover:scale-105 transition duration-300">
            <p className="text-lg font-medium text-blue-800">Total Courses</p>
            <p className="text-3xl font-bold text-blue-900">{overallStats.totalCourses}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg hover:scale-105 transition duration-300">
            <p className="text-lg font-medium text-green-800">Total Sessions</p>
            <p className="text-3xl font-bold text-green-900">{overallStats.totalSessions}</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg hover:scale-105 transition duration-300">
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


      <div className="bg-white p-6 rounded-lg shadow-lg mb-8 animate-fade-in-up">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <FaSort className="mr-2 text-blue-600" /> Filter & Sort Courses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

    
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <FaBook className="mr-2 text-green-600" /> Course Statistics
        </h2>
        {filteredStats.length === 0 ? (
          <p className="text-gray-600">No courses match the current filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStats.map((stat) => {

              const totalPossibleSessions = stat.totalEnrollments * stat.totalSessions;
             
              const completedSessions = totalPossibleSessions * (stat.overallProgress / 100);

              const barChartData = {
                labels: ['Total Enrollments', 'Completed Sessions'],
                datasets: [
                  {
                    label: 'Statistics',
                    data: [stat.totalEnrollments, Math.round(completedSessions)],
                    backgroundColor: ['#3498db', '#2ecc71'],
                  },
                ],
              };

              return (
                <div
                  key={stat.courseId}
                  className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition duration-300 animate-fade-in-up"
                >
                  <h3 className="text-lg font-medium text-gray-800 mb-2">{stat.title}</h3>
                  <p className="mb-2 text-gray-600">Enrollments: {stat.totalEnrollments}</p>
                  <p className="mb-2 text-gray-600">Sessions per Enrollment: {stat.totalSessions}</p>
                  <p className="mb-2 text-gray-600">
                    Created: {new Date(stat.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mb-4">
                    <p className="text-gray-600">
                      Average Progress: {stat.overallProgress.toFixed(1)}%
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(Math.max(stat.overallProgress, 0), 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-full h-48">
                    <Bar
                      data={barChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Count',
                            },
                          },
                        },
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value}`;
                              },
                            },
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

      {stats.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg mt-8 animate-fade-in-up">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Progress Trends</h2>
          <div className="w-full h-64">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: 'Progress (%)',
                    },
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Last Updated',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default StatsOverview;
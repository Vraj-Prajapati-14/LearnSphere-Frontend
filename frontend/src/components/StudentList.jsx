import { FaUser } from 'react-icons/fa';

const StudentList = ({ filteredStudentProgress, expandedStudent, toggleStudentDetails, studentSortBy, setStudentSortBy, filter, setFilter }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-8 animate-fade-in-up">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
        <FaUser className="mr-2 text-purple-600" /> Enrolled Students
      </h2>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Progress (%)</label>
          <select
            value={filter.progress}
            onChange={(e) => setFilter({ ...filter, progress: e.target.value })}
            className="w-full sm:w-48 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="25">25%+</option>
            <option value="50">50%+</option>
            <option value="75">75%+</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort Students By</label>
          <select
            value={studentSortBy}
            onChange={(e) => setStudentSortBy(e.target.value)}
            className="w-full sm:w-48 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="enrollmentCount">Enrollment Count</option>
            <option value="averageProgress">Average Progress</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
      {filteredStudentProgress.length === 0 ? (
        <p className="text-gray-600">No students match the current filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudentProgress.map((student) => {
            // Clamp averageProgress to ensure it's between 0 and 100
            const clampedAvgProgress = Math.min(Math.max(student.averageProgress || 0, 0), 100);

            return (
              <div
                key={student.userId}
                className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 animate-fade-in-up"
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
                  <p className="text-gray-600">
                    Average Progress: {clampedAvgProgress.toFixed(1)}%
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-1 overflow-hidden">
                    <div
                      className="bg-purple-500 h-4 rounded-full transition-all duration-500 ease-in-out"
                      style={{ width: `${clampedAvgProgress}%` }}
                    ></div>
                  </div>
                </div>
                {expandedStudent === student.userId && (
                  <div className="mt-4 animate-fade-in">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Enrolled Courses</h4>
                    {student.courses.length === 0 ? (
                      <p className="text-gray-600">No courses enrolled.</p>
                    ) : (
                      <ul className="space-y-2">
                        {student.courses.map((course) => {
                          // Clamp course progress to ensure it's between 0 and 100
                          const clampedCourseProgress = Math.min(Math.max(course.progress || 0, 0), 100);

                          return (
                            <li
                              key={course.courseId}
                              className="bg-white p-2 rounded-lg shadow-sm"
                            >
                              <p className="text-gray-800">{course.courseTitle}</p>
                              <p className="text-gray-600">
                                Progress: {clampedCourseProgress.toFixed(1)}%
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-3 mt-1 overflow-hidden">
                                <div
                                  className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-in-out"
                                  style={{ width: `${clampedCourseProgress}%` }}
                                ></div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentList;
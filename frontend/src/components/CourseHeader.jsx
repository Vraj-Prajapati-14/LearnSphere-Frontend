import { useNavigate } from 'react-router-dom';

export default function CourseHeader({ course, courseId, handleDeleteCourse }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{course.title}</h1>
      {/* <h1 className="text-3xl font-bold text-gray-800 mb-4">{course.category}</h1> */}
      <p className="text-gray-600 mb-4">{course.description || 'No description available'}</p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate(`/courses/${courseId}/edit`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Edit Course
        </button>
        <button
          onClick={() => navigate(`/courses/${courseId}/add-session`)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          Add Session
        </button>
        <button
          onClick={handleDeleteCourse}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
        >
          Delete Course
        </button>
      </div>
    </div>
  );
}
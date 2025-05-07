import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full mx-auto bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! The page you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 font-medium"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
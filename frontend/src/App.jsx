import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthForm from './components/AuthForm.jsx';
import Dashboard from './components/InstructorDashboard.jsx';
import SessionForm from './components/SessionForm.jsx';
import CourseManage from './components/CourseManage.jsx';
import { useAuth } from './context/AuthContext.jsx';
import CourseForm from './components/CourseForm.jsx';
import StudentDashboard from './components/studentDashboard.jsx';
import Navbar from './components/Navbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import EnrolledCourses from './components/EnrolledCourses.jsx';
import CourseProgress from './components/CourseProgress.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { loading } = useAuth();
  const location = useLocation(); // Use useLocation here

  if (loading) return <div>Loading...</div>;

  return (
    <>
      {/* Render Navbar only if the current route is not '/login' or '/register' */}
      {location.pathname !== '/login' && location.pathname !== '/register' && <Navbar />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthForm isRegister={false} />} />
        <Route path="/register" element={<AuthForm isRegister={true} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studentdashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }/>
          <Route
          path="/enrolled-courses"
          element={
            <ProtectedRoute>
              <EnrolledCourses/>
            </ProtectedRoute>
          }/>
          <Route
          path="/course/:courseId/progress"
          element={
            <ProtectedRoute>
              <CourseProgress/>
            </ProtectedRoute>
          }/>
         
        <Route
          path="/courses/add"
          element={
            <ProtectedRoute>
              <CourseForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/edit"
          element={
            <ProtectedRoute>
              <CourseForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/manage"
          element={
            <ProtectedRoute>
              <CourseManage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/add-session"
          element={
            <ProtectedRoute>
              <SessionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/sessions/:sessionId/edit"
          element={
            <ProtectedRoute>
              <SessionForm />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;

// import { useForm } from 'react-hook-form';
// import { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext.jsx';

// export default function AuthForm({ isRegister }) {
//   const { register, handleSubmit, formState: { errors } } = useForm();
//   const [apiError, setApiError] = useState(null);
//   const { login } = useAuth();
//   const navigate = useNavigate();
//   const API_URL = import.meta.env.VITE_API_URL;

//   const onSubmit = async (data) => {
//     try {
//       setApiError(null);
//       if (isRegister) {
//         await axios.post(`${API_URL}/auth/register`, {
//           email: data.email,
//           password: data.password,
//           role: data.role || 'Student',
//         });
//         navigate('/login');
//       } else {
//         const response = await axios.post(`${API_URL}/auth/login`, {
//           email: data.email,
//           password: data.password,
//         });
//         login(response.data.data); // { user: { id, email, role }, token }
//         navigate('/dashboard');
//       }
//     } catch (error) {
//       setApiError(error.response?.data?.error || 'Something went wrong');
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">
//       <form
//         onSubmit={handleSubmit(onSubmit)}
//         className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
//       >
//         <h2 className="text-2xl font-bold mb-6 text-center">
//           {isRegister ? 'Register' : 'Login'}
//         </h2>

//         <div className="mb-4">
//           <label htmlFor="email" className="block text-sm font-medium text-gray-700">
//             Email
//           </label>
//           <input
//             id="email"
//             type="email"
//             {...register('email', {
//               required: 'Email is required',
//               pattern: {
//                 value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
//                 message: 'Invalid email address',
//               },
//             })}
//             className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           {errors.email && (
//             <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
//           )}
//         </div>

//         <div className="mb-4">
//           <label htmlFor="password" className="block text-sm font-medium text-gray-700">
//             Password
//           </label>
//           <input
//             id="password"
//             type="password"
//             {...register('password', {
//               required: 'Password is required',
//               minLength: {
//                 value: 6,
//                 message: 'Password must be at least 6 characters',
//               },
//             })}
//             className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           {errors.password && (
//             <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
//           )}
//         </div>

//         {isRegister && (
//           <div className="mb-4">
//             <label htmlFor="role" className="block text-sm font-medium text-gray-700">
//               Role
//             </label>
//             <select
//               id="role"
//               {...register('role', { required: 'Role is required' })}
//               className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="Student">Student</option>
//               <option value="Instructor">Instructor</option>
//             </select>
//             {errors.role && (
//               <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
//             )}
//           </div>
//         )}

//         {apiError && (
//           <p className="mb-4 text-sm text-red-500 text-center">{apiError}</p>
//         )}

//         <button
//           type="submit"
//           className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition"
//         >
//           {isRegister ? 'Register' : 'Login'}
//         </button>

//         <p className="mt-4 text-sm text-center">
//           {isRegister ? 'Already have an account?' : 'Need an account?'}
//           <a
//             href={isRegister ? '/login' : '/register'}
//             className="text-blue-500 hover:underline ml-1"
//           >
//             {isRegister ? 'Login' : 'Register'}
//           </a>
//         </p>
//       </form>
//     </div>
//   );
// }
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthForm({ isRegister }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [apiError, setApiError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const onSubmit = async (data) => {
    try {
      setApiError(null);
      if (isRegister) {
        await axios.post(`${API_URL}/auth/register`, {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role || 'Student',
        });
        navigate('/login');
      } else {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: data.email,
          password: data.password,
        });
        const userData = response.data.data; // { user: { id, email, role }, token }
        login(userData);
  
        // Navigate based on role
        if (userData.user.role === 'Student') {
          navigate('/studentdashboard');
        } else if (userData.user.role === 'Instructor') {
          navigate('/dashboard');
        } else {
          navigate('/dashboard'); // fallback
        }
      }
    } catch (error) {
      setApiError(error.response?.data?.error || 'Something went wrong');
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isRegister ? 'Register' : 'Login'}
        </h2>

        {isRegister && (
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 3,
                  message: 'Name must be at least 3 characters long',
                },
              })}
              className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email address',
              },
            })}
            className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {isRegister && (
          <div className="mb-4">
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              {...register('role', { required: 'Role is required' })}
              className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Student">Student</option>
              <option value="Instructor">Instructor</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>
        )}

        {apiError && (
          <p className="mb-4 text-sm text-red-500 text-center">{apiError}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition"
        >
          {isRegister ? 'Register' : 'Login'}
        </button>

        <p className="mt-4 text-sm text-center">
          {isRegister ? 'Already have an account?' : 'Need an account?'}
          <a
            href={isRegister ? '/login' : '/register'}
            className="text-blue-500 hover:underline ml-1"
          >
            {isRegister ? 'Login' : 'Register'}
          </a>
        </p>
      </form>
    </div>
  );
}

import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useEffect, useState } from 'react';

export default function CourseForm() {
  const { register, handleSubmit, reset } = useForm();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryRes, courseRes] = await Promise.all([
          axios.get(`${API_URL}/category`, {
            withCredentials: true,
          }), 
          courseId
            ? axios.get(`${API_URL}/courses/${courseId}`, {
              withCredentials: true,
              })
            : Promise.resolve(null),
        ]);

        setCategories(categoryRes.data.categories || []);
        

        if (courseRes) {
          const course = courseRes.data.data;
          reset({
            title: course.title,
            description: course.description,
            categoryId: course.categoryId,
            isPublished: course.isPublished,
          });
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        alert('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_URL, user.token, courseId, reset]);
// console.log(categories);

const onSubmit = async (formData) => {
  try {
    if (formData.categoryId) {
      formData.categoryId = parseInt(formData.categoryId, 10);
    }

    // console.log('Form Data:', formData);  

    if (courseId) {
      await axios.put(`${API_URL}/courses/${courseId}`, formData, {
        withCredentials: true,
      });
      navigate(`/courses/${courseId}/manage`);
    } else {
      await axios.post(`${API_URL}/courses`, formData, {
        withCredentials: true,
      });
      navigate(`/dashboard`);
    }
  } catch (error) {
    console.error('Error submitting course:', error);
    alert('Course submit failed');
  }
};

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-lg shadow-md max-w-xl w-full space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">
          {courseId ? 'Edit Course' : 'Create Course'}
        </h2>

        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <>
            <div>
              <label className="block font-medium">Title</label>
              <input
                type="text"
                {...register('title', { required: true })}
                className="w-full border px-3 py-2 rounded-md"
              />
            </div>

            <div>
              <label className="block font-medium">Description</label>
              <textarea
                {...register('description', { required: true })}
                className="w-full border px-3 py-2 rounded-md"
                rows="4"
              />
            </div>

            <div>
              <label className="block font-medium">Category</label>
              <select
                {...register('categoryId', { required: true })}
                className="w-full border px-3 py-2 rounded-md"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('isPublished')} />
              <label className="text-sm">Publish immediately</label>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-md"
            >
              {courseId ? 'Update Course' : 'Create Course'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

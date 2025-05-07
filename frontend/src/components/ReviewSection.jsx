import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ReviewSection({ courseId, user }) {
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isCommenting, setIsCommenting] = useState({});
  const [newComment, setNewComment] = useState({});
  const [hasReviewed, setHasReviewed] = useState(false);
  const [commentMessages, setCommentMessages] = useState({});
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user, courseId]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews/course/${courseId}`, {
        withCredentials: true,
      });
      console.log('fetchReviews - Response:', response.data);
      const fetchedReviews = response.data.data || [];
      setReviews(fetchedReviews);
      const userReview = fetchedReviews.find((review) => review.userId === user.id);
      setHasReviewed(!!userReview);
      setError(null);
    } catch (err) {
      console.error('fetchReviews - Failed:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.error || 'Failed to load reviews');
    }
  };

  const handleReviewSubmit = async () => {
    if (hasReviewed) {
      setError('You have already reviewed this course.');
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setError('Please provide a rating between 1 and 5 stars.');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/reviews/${courseId}`,
        { rating: Number(rating), text: reviewText },
        { withCredentials: true }
      );
      // console.log('handleReviewSubmit - Response:', response.data);
      setReviewText('');
      setRating(0);
      setHasReviewed(true);
      setSuccess('Review added successfully!');
      fetchReviews();
    } catch (err) {
      console.error('handleReviewSubmit - Failed:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.error || 'Failed to add review');
    }
  };

  const handleCommentSubmit = async (reviewId) => {
    if (!newComment[reviewId]?.trim()) {
      setCommentMessages((prev) => ({ ...prev, [reviewId]: { error: 'Comment cannot be empty' } }));
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/reviews/comment/${reviewId}`,
        { text: newComment[reviewId] },
        { withCredentials: true }
      );
      // console.log('handleCommentSubmit - Response:', response.data);
      setNewComment((prev) => ({ ...prev, [reviewId]: '' }));
      setIsCommenting((prev) => ({ ...prev, [reviewId]: false }));
      setCommentMessages((prev) => ({ ...prev, [reviewId]: { success: 'Comment added successfully!' } }));
      fetchReviews();
      setTimeout(() => {
        setCommentMessages((prev) => ({ ...prev, [reviewId]: {} }));
      }, 3000); 
    } catch (err) {
      console.error('handleCommentSubmit - Failed:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setCommentMessages((prev) => ({
        ...prev,
        [reviewId]: { error: err.response?.data?.error || 'Failed to add comment' },
      }));
    }
  };

  const toggleCommentInput = (reviewId) => {
    setIsCommenting((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
    setCommentMessages((prev) => ({ ...prev, [reviewId]: {} })); 
  };

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-2xl ${i <= rating ? 'text-yellow-400' : 'text-gray-300'} ${interactive && !hasReviewed ? 'cursor-pointer hover:text-yellow-300 transition-colors duration-200' : ''}`}
          onClick={() => interactive && !hasReviewed && setRating(i)}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const isInstructor = user?.role === 'Instructor';

  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
        <svg className="w-6 h-6 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Reviews
      </h3>
      {error && (
        <p className="text-red-600 bg-red-50 p-3 rounded-lg mb-4 text-sm">{error}</p>
      )}
      {success && (
        <p className="text-green-600 bg-green-50 p-3 rounded-lg mb-4 text-sm">{success}</p>
      )}
      {reviews.length === 0 ? (
        <p className="text-gray-500 italic">No reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <span className="font-medium text-gray-800">{review.user.name}</span>
                <div className="flex gap-1 mt-2 sm:mt-0">{renderStars(review.rating)}</div>
              </div>
              <p className="text-gray-600 text-sm">{review.text || 'No review text provided'}</p>
              <div className="mt-4 ml-2 sm:ml-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleCommentInput(review.id)}
                    className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-all duration-200 shadow-sm ${
                      isCommenting[review.id]
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isCommenting[review.id] ? 'Cancel' : 'Add Comment'}
                  </button>
                </div>
                {isCommenting[review.id] && (
                  <div className="mt-3 transition-all duration-300">
                    <textarea
                      value={newComment[review.id] || ''}
                      onChange={(e) => setNewComment((prev) => ({ ...prev, [review.id]: e.target.value }))}
                      rows="2"
                      className="w-full p-3 rounded-lg bg-gray-100 border border-gray-300 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
                      placeholder="Write your comment..."
                    />
                    <button
                      onClick={() => handleCommentSubmit(review.id)}
                      className="mt-2 bg-green-500 text-white py-1.5 px-4 rounded-lg hover:bg-green-600 transition-all duration-200 text-sm font-medium shadow-sm"
                    >
                      Submit Comment
                    </button>
                    {commentMessages[review.id]?.error && (
                      <p className="text-red-600 bg-red-50 p-2 rounded-lg mt-2 text-sm">
                        {commentMessages[review.id].error}
                      </p>
                    )}
                    {commentMessages[review.id]?.success && (
                      <p className="text-green-600 bg-green-50 p-2 rounded-lg mt-2 text-sm">
                        {commentMessages[review.id].success}
                      </p>
                    )}
                  </div>
                )}
                {review.comments && review.comments.length > 0 ? (
                  <div className="mt-3 flex flex-col gap-2">
                    {review.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-100 p-3 rounded-lg text-sm shadow-sm">
                        <p className="text-gray-700">
                          <strong className="text-gray-800">{comment.user.name}</strong>: {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mt-2">No comments yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {!isInstructor && (
        <div className="mt-8 pt-4 border-t border-gray-200">
          <h4 className="text-xl font-medium text-gray-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Add Review
          </h4>
          {hasReviewed ? (
            <p className="text-gray-500 italic text-sm">You have already reviewed this course.</p>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg shadow-md">
              <div className="flex gap-1 mb-3">{renderStars(rating, true)}</div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows="3"
                className="w-full p-3 rounded-lg bg-gray-100 border border-gray-300 text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm shadow-sm"
                placeholder="Write your review here..."
              />
              <button
                onClick={handleReviewSubmit}
                className="mt-3 bg-blue-500 text-white py-1.5 px-4 rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium shadow-sm"
              >
                Submit Review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
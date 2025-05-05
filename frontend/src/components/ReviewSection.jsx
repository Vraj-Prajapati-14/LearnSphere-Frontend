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
      console.log('handleReviewSubmit - Response:', response.data);
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
      console.log('handleCommentSubmit - Response:', response.data);
      setNewComment((prev) => ({ ...prev, [reviewId]: '' }));
      setIsCommenting((prev) => ({ ...prev, [reviewId]: false }));
      setCommentMessages((prev) => ({ ...prev, [reviewId]: { success: 'Comment added successfully!' } }));
      fetchReviews();
      setTimeout(() => {
        setCommentMessages((prev) => ({ ...prev, [reviewId]: {} }));
      }, 3000); // Auto-dismiss success after 3 seconds
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
    setCommentMessages((prev) => ({ ...prev, [reviewId]: {} })); // Clear messages on toggle
  };

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`text-2xl ${i <= rating ? 'text-yellow-400' : 'text-gray-600'} ${interactive && !hasReviewed ? 'cursor-pointer hover:text-yellow-300' : ''}`}
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
    <div className="mt-6 bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
      {/* ... (h3, error, success, reviews.length check unchanged) */}
      {reviews.length === 0 ? (
        <p className="text-gray-400 italic">No reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-gray-900 p-4 rounded-lg shadow-md hover:scale-105 transition transform duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <span className="font-medium text-gray-100">{review.user.name}</span>
                <div className="flex gap-1 mt-2 sm:mt-0">{renderStars(review.rating)}</div>
              </div>
              <p className="text-gray-300 text-sm">{review.text || 'No review text provided'}</p>
              <div className="mt-4 ml-2 sm:ml-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleCommentInput(review.id)}
                    className={`text-sm px-3 py-1 rounded-md text-gray-100 transition ${
                      isCommenting[review.id]
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isCommenting[review.id] ? 'Cancel' : 'Add Comment'}
                  </button>
                </div>
                {isCommenting[review.id] && (
                  <div className="mt-2 transition-all duration-300">
                    <textarea
                      value={newComment[review.id] || ''}
                      onChange={(e) => setNewComment((prev) => ({ ...prev, [review.id]: e.target.value }))}
                      rows="2"
                      className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                      placeholder="Write your comment..."
                    />
                    <button
                      onClick={() => handleCommentSubmit(review.id)}
                      className="mt-2 bg-green-600 text-white py-1 px-3 rounded-md hover:bg-green-700 transition text-sm"
                    >
                      Submit Comment
                    </button>
                    {commentMessages[review.id]?.error && (
                      <p className="text-red-300 bg-red-900 p-2 rounded-md mt-2 text-sm">
                        {commentMessages[review.id].error}
                      </p>
                    )}
                    {commentMessages[review.id]?.success && (
                      <p className="text-green-300 bg-green-900 p-2 rounded-md mt-2 text-sm">
                        {commentMessages[review.id].success}
                      </p>
                    )}
                  </div>
                )}
                {review.comments && review.comments.length > 0 ? (
                  <div className="mt-2 flex flex-col gap-2">
                    {review.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-700 p-2 rounded-md text-sm">
                        <p className="text-gray-200">
                          <strong className="text-gray-100">{comment.user.name}</strong>: {comment.text}
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
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-lg font-medium text-gray-100 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Add Review
          </h4>
          {hasReviewed ? (
            <p className="text-gray-400 italic text-sm">You have already reviewed this course.</p>
          ) : (
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-lg shadow-md">
              <div className="flex gap-1 mb-2">{renderStars(rating, true)}</div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows="3"
                className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                placeholder="Write your review here..."
              />
              <button
                onClick={handleReviewSubmit}
                className="mt-2 bg-blue-600 text-white py-1 px-4 rounded-md hover:bg-blue-700 transition text-sm"
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
"use client";

import { useState } from 'react';
import { Review } from '../lib/data';
import { Star, User, AlertCircle } from 'lucide-react';
import { useAuth } from './ProvidersContext';

interface ReviewsListProps {
    reviews: Review[];
    providerId: string;
}

export default function ReviewsList({ reviews: initialReviews, providerId }: ReviewsListProps) {
    const { currentUser } = useAuth();
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [removalReviewId, setRemovalReviewId] = useState<string | null>(null);
    const [removalReason, setRemovalReason] = useState('');
    const [removalLoading, setRemovalLoading] = useState(false);

    const isCustomer = currentUser?.role === 'customer' || currentUser?.role === 'admin';
    const isOwner = currentUser?.role === 'provider' && currentUser?.providerId === providerId;

    const renderStars = (currentRating: number, interactive = false) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                size={interactive ? 24 : 16}
                onClick={() => interactive && setRating(i + 1)}
                className={`${i < currentRating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            />
        ));
    };

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch(`/api/providers/${providerId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setReviews([data.review, ...reviews]);
                setComment('');
                setRating(5);
            } else {
                setError(data.message || 'Failed to submit review');
            }
        } catch (err) {
            setError('An error occurred while submitting.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const requestRemoval = async (reviewId: string) => {
        if (!removalReason || removalReason.length < 10) {
            alert('Please provide a reason (min 10 characters).');
            return;
        }

        setRemovalLoading(true);
        try {
            const res = await fetch(`/api/providers/${providerId}/reviews/${reviewId}/request-removal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: removalReason })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert('Removal request sent to admin successfully.');
                setRemovalReviewId(null);
                setRemovalReason('');
            } else {
                alert(data.message || 'Failed to submit request');
            }
        } catch (err) {
            alert('An error occurred.');
        } finally {
            setRemovalLoading(false);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Reviews</h3>
                {reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(Math.round(parseFloat(averageRating)))}</div>
                        <span className="text-sm font-bold text-gray-700">{averageRating} / 5</span>
                        <span className="text-sm text-gray-400">({reviews.length} reviews)</span>
                    </div>
                )}
            </div>

            {isCustomer && (
                <form onSubmit={submitReview} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Leave a review</h4>
                    {error && <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</div>}
                    <div className="flex mb-3 gap-1">
                        {renderStars(rating, true)}
                    </div>
                    <textarea
                        required
                        rows={3}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Share your experience..."
                        className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-primary mb-3"
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold transition hover:bg-teal-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            )}

            {reviews.length === 0 ? (
                <p className="text-gray-500 text-sm">No reviews yet. Be the first to leave feedback!</p>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                    <User size={20} className="text-gray-500" />
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-semibold text-gray-900">{review.author}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400">
                                                {new Date(review.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                            {isOwner && (
                                                <button
                                                    onClick={() => setRemovalReviewId(review.id)}
                                                    className="text-xs text-red-500 font-semibold hover:underline flex items-center gap-1"
                                                >
                                                    <AlertCircle size={14} /> Request Removal
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex mb-2">{renderStars(review.rating)}</div>
                                    <p className="text-sm text-gray-700">{review.comment}</p>
                                    
                                    {removalReviewId === review.id && (
                                        <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100">
                                            <p className="text-sm font-semibold text-red-800 mb-2">Request Admin to Remove Review</p>
                                            <textarea
                                                placeholder="Reason for removal (min 10 chars)..."
                                                value={removalReason}
                                                onChange={e => setRemovalReason(e.target.value)}
                                                className="w-full rounded-md border border-red-200 p-2 text-sm outline-none focus:border-red-500 mb-2"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => requestRemoval(review.id)}
                                                    disabled={removalLoading}
                                                    className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {removalLoading ? 'Sending...' : 'Submit Request'}
                                                </button>
                                                <button
                                                    onClick={() => { setRemovalReviewId(null); setRemovalReason(''); }}
                                                    className="bg-white text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import { Review } from '../lib/data';
import { Star, User } from 'lucide-react';

interface ReviewsListProps {
    reviews: Review[];
}

export default function ReviewsList({ reviews }: ReviewsListProps) {

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                size={16}
                className={i < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
            />
        ));
    };

    if (reviews.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Reviews</h3>
                <p className="text-gray-500 text-sm">No reviews yet. Be the first to leave feedback!</p>
            </div>
        );
    }

    const averageRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Reviews</h3>
                <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(Math.round(parseFloat(averageRating)))}</div>
                    <span className="text-sm font-bold text-gray-700">{averageRating} / 5</span>
                    <span className="text-sm text-gray-400">({reviews.length} reviews)</span>
                </div>
            </div>

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
                                    <span className="text-xs text-gray-400">
                                        {new Date(review.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="flex mb-2">{renderStars(review.rating)}</div>
                                <p className="text-sm text-gray-700">{review.comment}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

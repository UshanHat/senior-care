"use client";

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { Clock3, Mail, MessageCircle, X } from 'lucide-react';
import { useAuth, useProviders } from './ProvidersContext';

interface ChatBoxProps {
    providerId: string;
    providerName: string;
}

export default function ChatBox({ providerId, providerName }: ChatBoxProps) {
    const { currentUser, isAuthenticated } = useAuth();
    const { requestChat, getRequestsForCustomer } = useProviders();
    const [isOpen, setIsOpen] = useState(false);
    const [preferredTime, setPreferredTime] = useState('');
    const [message, setMessage] = useState('');
    const [feedback, setFeedback] = useState('');

    const customerRequests =
        currentUser && currentUser.role === 'customer'
            ? getRequestsForCustomer(currentUser.id).filter((request) => request.providerId === providerId)
            : [];

    const handleSendRequest = async () => {
        if (!preferredTime || !message.trim()) {
            setFeedback('Please choose a preferred time and add a short message.');
            return;
        }

        const result = await requestChat({
            providerId,
            preferredTime,
            message
        });

        setFeedback(result.message);

        if (result.success) {
            setPreferredTime('');
            setMessage('');

            if (result.emailLink) {
                window.location.href = result.emailLink;
            }
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="fixed bottom-6 right-6 z-40 rounded-full bg-primary p-4 text-white shadow-lg transition-all hover:scale-110 hover:bg-teal-700"
                aria-label="Open request chat"
            >
                <MessageCircle className="h-6 w-6" />
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 flex h-[540px] w-[380px] flex-col rounded-3xl border border-gray-200 bg-white shadow-2xl animate-slide-up">
                    <div className="flex items-center justify-between rounded-t-3xl bg-primary px-5 py-4 text-white">
                        <div>
                            <h3 className="font-bold">{providerName}</h3>
                            <p className="text-xs opacity-90">Request a direct email + chat time</p>
                        </div>
                        <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-1 transition hover:bg-teal-700">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
                        {!isAuthenticated ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-600">
                                <p className="font-semibold text-gray-900">Login required</p>
                                <p className="mt-2">Customers must log in before they can ask a provider for a chat time or direct email response.</p>
                                <Link href="/auth" className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 font-semibold text-white transition hover:bg-teal-700">
                                    Login / Sign Up
                                </Link>
                            </div>
                        ) : currentUser?.role !== 'customer' ? (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-600">
                                <p className="font-semibold text-gray-900">Customer-only request flow</p>
                                <p className="mt-2">
                                    Providers and admins can review requests from their dashboards. Customers are the ones who can request a chat time from here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                        <Mail className="h-4 w-4 text-primary" />
                                        Direct provider email request
                                    </div>
                                    <p className="mt-2 text-sm text-gray-600">
                                        Submitting this form records your request and opens a direct email draft to the provider.
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                    <label className="text-sm font-semibold text-gray-900">Preferred chat/request time</label>
                                    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-gray-300 px-3 py-3">
                                        <Clock3 className="h-4 w-4 text-primary" />
                                        <input
                                            type="datetime-local"
                                            value={preferredTime}
                                            onChange={(event) => setPreferredTime(event.target.value)}
                                            className="w-full bg-transparent text-sm outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                    <label className="text-sm font-semibold text-gray-900">Message to provider</label>
                                    <textarea
                                        rows={5}
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value)}
                                        placeholder="Explain what support you need and when you would like to talk."
                                        className="mt-2 w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
                                    />
                                </div>

                                {feedback && (
                                    <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">
                                        {feedback}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSendRequest}
                                    className="w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-teal-700"
                                >
                                    Send Request Email
                                </button>

                                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                                    <p className="text-sm font-semibold text-gray-900">Your previous requests to this provider</p>
                                    <div className="mt-3 space-y-3">
                                        {customerRequests.length === 0 ? (
                                            <p className="text-sm text-gray-500">No requests sent to this provider yet.</p>
                                        ) : (
                                            customerRequests.map((request) => (
                                                <div key={request.id} className="rounded-2xl bg-gray-50 px-4 py-3">
                                                    <p className="text-sm font-semibold text-gray-900">{new Date(request.preferredTime).toLocaleString()}</p>
                                                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-400">{request.status}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

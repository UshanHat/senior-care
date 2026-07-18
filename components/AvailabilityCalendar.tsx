"use client";

import { useState } from 'react';
import { AvailabilitySlot } from '../lib/data';
import { Calendar, CheckCircle, ChevronLeft, ChevronRight, Umbrella, XCircle } from 'lucide-react';

interface AvailabilityCalendarProps {
    availability: AvailabilitySlot[];
    onUpdateAvailability?: (date: string, status: AvailabilitySlot['status']) => void;
    isEditable?: boolean;
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (value: number) => String(value).padStart(2, '0');

const toDateKey = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export default function AvailabilityCalendar({
    availability,
    onUpdateAvailability,
    isEditable = false
}: AvailabilityCalendarProps) {
    const [visibleMonth, setVisibleMonth] = useState(() => {
        if (availability[0]) {
            return new Date(`${availability[0].date}T00:00:00`);
        }

        return new Date();
    });

    const getNextStatus = (status: AvailabilitySlot['status']): AvailabilitySlot['status'] => {
        switch (status) {
            case 'available':
                return 'booked';
            case 'booked':
                return 'holiday';
            case 'holiday':
                return 'unavailable';
            default:
                return 'available';
        }
    };

    const getStatusTone = (status?: AvailabilitySlot['status']) => {
        switch (status) {
            case 'available':
                return 'bg-green-100 text-green-700 ring-green-200';
            case 'booked':
                return 'bg-red-100 text-red-700 ring-red-200';
            case 'holiday':
                return 'bg-amber-100 text-amber-700 ring-amber-200';
            case 'unavailable':
                return 'bg-slate-100 text-slate-500 ring-slate-200';
            default:
                return 'bg-white text-gray-700 ring-gray-200 hover:bg-gray-50';
        }
    };

    const getStatusIcon = (status?: AvailabilitySlot['status']) => {
        switch (status) {
            case 'available':
                return <CheckCircle className="h-4 w-4" />;
            case 'booked':
                return <XCircle className="h-4 w-4" />;
            case 'holiday':
                return <Umbrella className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const slotsByDate = new Map(availability.map((slot) => [slot.date, slot]));
    const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const leadingBlanks = monthStart.getDay();

    const monthDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);

    return (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-teal-50 p-3 text-primary">
                        <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Availability Calendar</h3>
                        <p className="text-sm text-gray-500">
                            {isEditable ? 'Click a date to cycle through availability states.' : 'Provider availability for the selected month.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:border-primary hover:text-primary"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="min-w-40 text-center text-sm font-semibold text-gray-700">
                        {visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                        type="button"
                        onClick={() => setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:border-primary hover:text-primary"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                {weekdayLabels.map((label) => (
                    <div key={label} className="py-2">
                        {label}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: leadingBlanks }).map((_, index) => (
                    <div key={`blank-${index}`} className="aspect-square rounded-2xl bg-transparent" />
                ))}

                {monthDays.map((day) => {
                    const currentDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
                    const dateKey = toDateKey(currentDate);
                    const slot = slotsByDate.get(dateKey);

                    return (
                        <button
                            key={dateKey}
                            type="button"
                            onClick={() => {
                                if (!isEditable || !onUpdateAvailability) {
                                    return;
                                }

                                onUpdateAvailability(dateKey, getNextStatus(slot?.status ?? 'unavailable'));
                            }}
                            className={`aspect-square rounded-2xl p-3 text-left ring-1 transition ${getStatusTone(slot?.status)} ${isEditable ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
                        >
                            <div className="flex h-full flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">{day}</span>
                                    {getStatusIcon(slot?.status)}
                                </div>
                                <div className="text-[11px] font-semibold">
                                    {slot?.status ? slot.status : 'open'}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
                {[
                    ['available', 'Available', 'green'],
                    ['booked', 'Booked', 'red'],
                    ['holiday', 'Holiday', 'amber'],
                    ['unavailable', 'Unavailable', 'slate']
                ].map(([key, label, color]) => (
                    <div key={key} className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
                        <span className={`h-3 w-3 rounded-full ${color === 'green' ? 'bg-green-500' : color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}

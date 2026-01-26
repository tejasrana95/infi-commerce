'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { formatTime, formatDate, formatDuration } from '@/utils/formatters';
import { useSessionStore } from '@/store/sessionStore';

export default function TimeDisplay() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const getSessionDuration = useSessionStore((state) => state.getSessionDuration);
    const [sessionDuration, setSessionDuration] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            setSessionDuration(getSessionDuration());
        }, 1000);

        return () => clearInterval(timer);
    }, [getSessionDuration]);

    return (
        <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-700" style={{ minWidth: '120px' }}>
                <Clock className="w-4 h-4" />
                <span className="font-bold">{formatTime(currentTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(currentTime)}</span>
            </div>
            <div className="px-3 py-1 bg-green-50 text-green-700 rounded-lg font-bold text-xs" style={{ minWidth: '135px' }}>
                Session: {formatDuration(sessionDuration)}
            </div>
        </div>
    );
}

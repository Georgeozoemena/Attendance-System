import { useState, useEffect } from 'react';
import { connectToSSE } from '../services/realtime.js';

export function useAttendanceData() {
    const [items, setItems] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [error, setError] = useState(null);

    // SSE subscription for live updates
    useEffect(() => {
        const es = connectToSSE('/api/admin/stream');
        es.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data);
                setItems((s) => [data, ...s]);
            } catch (err) {
                console.error('Invalid SSE payload', err);
            }
        };
        es.onerror = (err) => {
            console.error('SSE error', err);
            // Optional: setError('Real-time connection lost');
        };
        return () => es.close();
    }, []);

    // Initial (best-effort) load of historical rows
    useEffect(() => {
        async function loadHistory() {
            setLoadingHistory(true);
            try {
                const adminKey = localStorage.getItem('adminKey');
                const resp = await fetch('/api/attendance', {
                    headers: {
                        'x-admin-key': adminKey || ''
                    }
                });
                if (!resp.ok) {
                    // Fallback or empty state
                    setLoadingHistory(false);
                    return;
                }
                const data = await resp.json();
                if (Array.isArray(data) && data.length) {
                    // Prepend historical items
                    setItems((s) => [...(data.reverse ? data.reverse() : data), ...s]);
                }
            } catch (err) {
                console.warn('Failed to load history', err);
                setError('Failed to load historical data');
            } finally {
                setLoadingHistory(false);
            }
        }

        loadHistory();
    }, []);

    const fetchByEvent = async (eventId) => {
        if (!eventId) return;
        setLoadingHistory(true);
        try {
            const params = new URLSearchParams();
            params.set('eventId', eventId);
            const adminKey = localStorage.getItem('adminKey');
            const resp = await fetch(`/api/attendance?${params.toString()}`, {
                headers: {
                    'x-admin-key': adminKey || ''
                }
            });
            if (!resp.ok) throw new Error('Failed to fetch');
            const data = await resp.json();
            if (Array.isArray(data)) {
                // For filtered views, we might want to replace the current items or handle it differently.
                // For simplicity in this structure, we replace the items to show only that event's data.
                // Note: Real-time updates might still come in for *other* events, effectively "polluting" this filtered view.
                // A robust solution would filter the incoming SSE messages too.
                setItems(data.reverse());
            }
        } catch (err) {
            console.warn('Failed to fetch by event', err);
            setError('Failed to load event history');
        } finally {
            setLoadingHistory(false);
        }
    };

    return { items, loadingHistory, error, fetchByEvent };
}

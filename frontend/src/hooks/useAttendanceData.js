import { useState, useEffect, useRef } from 'react';
import { connectToSSE } from '../services/realtime.js';
import { API_BASE } from '../services/api.js';

export function useAttendanceData() {
    const [items, setItems] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [error, setError] = useState(null);

    const [currentEventId, setCurrentEventId] = useState('');
    const activeFilterRef = useRef('');

    // SSE subscription for live updates
    useEffect(() => {
        const es = connectToSSE(`${API_BASE}/api/admin/stream`);
        es.onmessage = (ev) => {
            try {
                const data = JSON.parse(ev.data);
                const currentFilter = activeFilterRef.current;
                
                // Only add to stream if we're viewing All Events OR the stream matches our specific filtered event
                if (!currentFilter || currentFilter === data.eventId) {
                    setItems((s) => [data, ...s]);
                }
            } catch (err) {
                console.error('Invalid SSE payload', err);
            }
        };
        es.onerror = (err) => {
            console.error('SSE error', err);
        };
        return () => es.close();
    }, []);

    // Initial load defaults to the current active event
    useEffect(() => {
        async function loadInitial() {
            setLoadingHistory(true);
            try {
                const adminKey = localStorage.getItem('adminKey');
                
                // 1. Fetch current active event
                const evRes = await fetch(`${API_BASE}/api/events/current`);
                let targetEventId = '';
                if (evRes.ok) {
                    const evData = await evRes.json();
                    targetEventId = evData.id;
                    setCurrentEventId(targetEventId);
                    activeFilterRef.current = targetEventId;
                }

                // 2. Fetch attendance for that event (or all history if none active)
                const fetchUrl = targetEventId 
                    ? `${API_BASE}/api/attendance?eventId=${targetEventId}` 
                    : `${API_BASE}/api/attendance`;

                const resp = await fetch(fetchUrl, {
                    headers: { 'x-admin-key': adminKey || '' }
                });

                if (resp.status === 401) {
                    localStorage.removeItem('adminKey');
                    window.location.href = '/admin/login';
                    return;
                }
                if (!resp.ok) {
                    setLoadingHistory(false);
                    return;
                }
                const data = await resp.json();
                if (Array.isArray(data) && data.length) {
                    const reversedData = [...data].reverse();
                    setItems((s) => [...reversedData, ...s]);
                }
            } catch (err) {
                console.warn('Failed to load initial history', err);
                setError('Failed to load initial data');
            } finally {
                setLoadingHistory(false);
            }
        }

        loadInitial();
    }, []);

    const fetchByEvent = async (eventId) => {
        // Allow empty string '' to fetch all items
        if (eventId === undefined || eventId === null) return;
        
        activeFilterRef.current = eventId;
        setLoadingHistory(true);
        try {
            const params = new URLSearchParams();
            params.set('eventId', eventId);
            const adminKey = localStorage.getItem('adminKey');
            const resp = await fetch(`${API_BASE}/api/attendance?${params.toString()}`, {
                headers: {
                    'x-admin-key': adminKey || ''
                }
            });
            if (resp.status === 401) {
                localStorage.removeItem('adminKey');
                window.location.href = '/admin/login';
                return;
            }
            if (!resp.ok) throw new Error('Failed to fetch');
            const data = await resp.json();
            if (Array.isArray(data)) {
                // For filtered views, we replace the items to show only that event's data.
                // Use spread to avoid mutating the original array.
                setItems([...data].reverse());
            }
        } catch (err) {
            console.warn('Failed to fetch by event', err);
            setError('Failed to load event history');
        } finally {
            setLoadingHistory(false);
        }
    };

    return { items, loadingHistory, error, fetchByEvent, currentEventId };
}

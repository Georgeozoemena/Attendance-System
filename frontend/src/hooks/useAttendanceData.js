import { useState, useEffect, useRef } from 'react';
import { connectToSSE } from '../services/realtime.js';
import { API_BASE, getAuthHeaders } from '../services/api.js';

export function useAttendanceData() {
    const [items, setItems] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [error, setError] = useState(null);

    const [currentEventId, setCurrentEventId] = useState('');
    const activeFilterRef = useRef('');

    // SSE subscription for live updates with reconnect backoff
    useEffect(() => {
        let es;
        let retryTimeout;
        let retryDelay = 2000;
        let active = true;

        function connect() {
            if (!active) return;
            es = connectToSSE(`${API_BASE}/api/admin/stream`);
            es.onmessage = (ev) => {
                try {
                    const data = JSON.parse(ev.data);
                    const currentFilter = activeFilterRef.current;
                    if (!currentFilter || currentFilter === data.eventId) {
                        setItems((s) => [data, ...s]);
                    }
                } catch (err) {
                    console.error('Invalid SSE payload', err);
                }
            };
            es.onerror = () => {
                es.close();
                if (active) {
                    retryTimeout = setTimeout(() => {
                        retryDelay = Math.min(retryDelay * 2, 30000); // cap at 30s
                        connect();
                    }, retryDelay);
                }
            };
            es.onopen = () => { retryDelay = 2000; }; // reset on success
        }

        connect();
        return () => {
            active = false;
            clearTimeout(retryTimeout);
            es?.close();
        };
    }, []);

    // Initial load defaults to the current active event
    useEffect(() => {
        async function loadInitial() {
            setLoadingHistory(true);
            try {
                // 1. Fetch current active event
                let targetEventId = '';
                try {
                    const evRes = await fetch(`${API_BASE}/api/events/current`);
                    if (evRes.ok) {
                        const evData = await evRes.json();
                        targetEventId = evData.id || '';
                        setCurrentEventId(targetEventId);
                        activeFilterRef.current = targetEventId;
                    }
                } catch (evErr) {
                    console.warn('Could not fetch current event, showing all records', evErr);
                }

                // 2. Fetch attendance for that event (or all history if none active)
                const fetchUrl = targetEventId 
                    ? `${API_BASE}/api/attendance?eventId=${encodeURIComponent(targetEventId)}` 
                    : `${API_BASE}/api/attendance`;

                const resp = await fetch(fetchUrl, {
                    headers: { ...getAuthHeaders() }
                });

                if (resp.status === 401) {
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
        if (eventId === undefined || eventId === null) return;
        activeFilterRef.current = eventId;
        setLoadingHistory(true);
        try {
            // Only add eventId param if it's a non-empty string
            const fetchUrl = eventId
                ? `${API_BASE}/api/attendance?eventId=${encodeURIComponent(eventId)}`
                : `${API_BASE}/api/attendance`;
            const resp = await fetch(fetchUrl, { headers: { ...getAuthHeaders() } });
            if (resp.status === 401) {
                window.location.href = '/admin/login';
                return;
            }
            if (!resp.ok) throw new Error('Failed to fetch');
            const data = await resp.json();
            if (Array.isArray(data)) setItems([...data].reverse());
        } catch (err) {
            console.warn('Failed to fetch by event', err);
            setError('Failed to load event history');
        } finally {
            setLoadingHistory(false);
        }
    };

    return { items, loadingHistory, error, fetchByEvent, currentEventId };
}

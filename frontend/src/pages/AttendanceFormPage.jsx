import React, { useState, useEffect } from 'react';
import AttendanceForm from '../components/Form/AttendanceForm.jsx';
import { useSearchParams } from 'react-router-dom';

export default function AttendanceFormPage() {
  const [searchParams] = useSearchParams();
  const [eventId, setEventId] = useState(searchParams.get('eventId'));
  const type = searchParams.get('type') || 'member';
  const [loading, setLoading] = useState(!eventId);
  
  useEffect(() => {
    if (!eventId) {
      const fetchCurrentEvent = async () => {
        try {
          const res = await fetch('/api/events/current');
          if (res.ok) {
            const data = await res.json();
            setEventId(data.id);
          } else {
            setEventId('default-event');
          }
        } catch (err) {
          console.error('Failed to fetch current event', err);
          setEventId('default-event');
        } finally {
          setLoading(false);
        }
      };
      fetchCurrentEvent();
    }
  }, [eventId]);

  if (loading) {
    return (
      <div className="attendance-form-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-1)', fontSize: '1.2rem' }}>Loading today's event details...</p>
      </div>
    );
  }
  
  return <AttendanceForm eventId={eventId} type={type} />;
}
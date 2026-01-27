import React from 'react';
import AttendanceForm from '../components/Form/AttendanceForm.jsx';
import { useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function AttendanceFormPage() {
  const q = useQuery();
  const eventId = q.get('eventId') || 'default-event';
  return <AttendanceForm eventId={eventId} />;
}
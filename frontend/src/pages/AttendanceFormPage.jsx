import React from 'react';
import AttendanceForm from '../components/Form/AttendanceForm.jsx';
import { useSearchParams } from 'react-router-dom';

export default function AttendanceFormPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') || 'default-event';
  const type = searchParams.get('type') || 'member';

  return <AttendanceForm eventId={eventId} type={type} />;
}
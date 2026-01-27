import React from 'react';
import { Outlet } from 'react-router-dom';

export default function App() {
  return (
    <div className='app-container'>
      <h1 className='text-center'>Church Attendance</h1>
      <Outlet />
    </div>
  );
}
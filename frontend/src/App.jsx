import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <div className='app-container'>
        <Outlet />
      </div>
    </ThemeProvider>
  );
}
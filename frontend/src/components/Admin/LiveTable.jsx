import React from 'react';

// Responsive Table component
export default function LiveTable({ items }) {
    // Responsive behavior is now handled purely by CSS using media queries
    // and data-label attributes for mobile stacking.

    return (
        <div className="table-responsive">
            <table className="table" aria-label="Live attendance table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>First Timer</th>
                        <th>Department</th>
                        <th>Event</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 && (
                        <tr>
                            <td colSpan="8" className="small" style={{ textAlign: 'center' }}>No submissions yet</td>
                        </tr>
                    )}
                    {items.map((row, i) => (
                        <tr key={row.id || i}>
                            <td data-label="Time">{row.createdAt}</td>
                            <td data-label="ID">{row.uniqueCode || '-'}</td>
                            <td data-label="Name" style={{ fontWeight: 600 }}>{row.name}</td>
                            <td data-label="Email">{row.email}</td>
                            <td data-label="Phone">{row.phone}</td>
                            <td data-label="First Timer">{row.firstTimer ? 'Yes' : 'No'}</td>
                            <td data-label="Department">{row.department || '-'}</td>
                            <td data-label="Event">{row.eventId}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

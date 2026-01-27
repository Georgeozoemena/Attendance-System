import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsDashboard({ attendanceData }) {
    // Process data for charts
    const deptData = React.useMemo(() => {
        const counts = {};
        attendanceData.forEach(r => {
            const d = r.department || 'Unknown';
            counts[d] = (counts[d] || 0) + 1;
        });
        return Object.keys(counts).map(k => ({ name: k, count: counts[k] }));
    }, [attendanceData]);

    const genderData = React.useMemo(() => {
        const counts = {};
        attendanceData.forEach(r => {
            const g = r.gender || 'Not Specified';
            counts[g] = (counts[g] || 0) + 1;
        });
        return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
    }, [attendanceData]);

    const firstTimerData = React.useMemo(() => {
        let yes = 0;
        let no = 0;
        attendanceData.forEach(r => {
            if (r.firstTimer) yes++; else no++;
        });
        return [
            { name: 'First Timers', value: yes },
            { name: 'Regular Members', value: no },
        ];
    }, [attendanceData]);

    if (!attendanceData || attendanceData.length === 0) {
        return (
            <div className="card text-center p-4">
                <p className="text-muted">No attendance data available for analysis.</p>
            </div>
        );
    }

    return (
        <div className="analytics-dashboard">
            <div className="admin-card-grid mb-4">
                {/* Card 1: Key Metrics */}
                <div className="card">
                    <h4>Total Attendance</h4>
                    <p className="text-primary" style={{ fontSize: '2.5rem', fontWeight: 700 }}>{attendanceData.length}</p>
                </div>
                <div className="card">
                    <h4>First Timers</h4>
                    <p className="text-success" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                        {firstTimerData.find(d => d.name === 'First Timers')?.value || 0}
                    </p>
                </div>
            </div>

            <div className="admin-card-grid mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Chart 1: Gender Distribution */}
                <div className="card">
                    <h4 className="mb-4">Gender Distribution</h4>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={genderData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {genderData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: First Timers vs Regular */}
                <div className="card">
                    <h4 className="mb-4">Member Type</h4>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={firstTimerData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label
                                >
                                    {firstTimerData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#4f46e5'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Chart 3: Department Bar Chart */}
            <div className="card mb-4">
                <h4 className="mb-4">Attendance by Department</h4>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={deptData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

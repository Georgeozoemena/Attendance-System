import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsDashboard({ attendanceData }) {
    // Process data for charts
    const { deptData, genderData, firstTimerData, trendData, hourlyData } = React.useMemo(() => {
        const dCounts = {};
        const gCounts = {};
        const hCounts = {}; // Key: "00" to "23", Value: count
        let ftYes = 0;
        let ftNo = 0;
        const tCounts = {}; // Key: "yyyy-mm-dd", Value: count

        attendanceData.forEach(r => {
            // Department
            const d = r.department || 'Unknown';
            dCounts[d] = (dCounts[d] || 0) + 1;

            // Gender
            const g = r.gender || 'Not Specified';
            gCounts[g] = (gCounts[g] || 0) + 1;

            // First Timer
            if (r.firstTimer) ftYes++; else ftNo++;

            // Trend & Hourly
            if (r.createdAt) {
                const dateObj = new Date(r.createdAt);

                // Trend
                const dateKey = dateObj.toISOString().split('T')[0];
                tCounts[dateKey] = (tCounts[dateKey] || 0) + 1;

                // Hourly
                const hour = dateObj.getHours(); // 0-23
                const hourKey = hour < 10 ? `0${hour}:00` : `${hour}:00`;
                hCounts[hourKey] = (hCounts[hourKey] || 0) + 1;
            }
        });

        // Convert to arrays
        const dept = Object.keys(dCounts).map(k => ({ name: k, count: dCounts[k] }));
        const gender = Object.keys(gCounts).map(k => ({ name: k, value: gCounts[k] }));
        const firstTimer = [
            { name: 'First Timers', value: ftYes },
            { name: 'Regular Members', value: ftNo },
        ];

        // Sort trends by date
        const trend = Object.keys(tCounts).sort().map(k => ({ date: k, count: tCounts[k] }));

        // Sort hourly 00:00 -> 23:00
        const hourly = Object.keys(hCounts).sort().map(k => ({ time: k, count: hCounts[k] }));

        return { deptData: dept, genderData: gender, firstTimerData: firstTimer, trendData: trend, hourlyData: hourly };
    }, [attendanceData]);

    if (!attendanceData || attendanceData.length === 0) {
        return (
            <div className="card text-center p-4" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="text-muted" style={{ fontSize: '1.1rem' }}>No attendance data available for analysis yet.</p>
            </div>
        );
    }

    return (
        <div className="analytics-dashboard" style={{
            height: 'calc(100vh - 300px)',
            overflowY: 'auto',
            paddingRight: '4px' // prevent scrollbar from covering content
        }}>
            <div className="admin-card-grid">
                {/* Card 1: Total Attendance */}
                <div className="card">
                    <h4>Total Attendance</h4>
                    <p className="metric-value">{attendanceData.length}</p>
                    <p className="metric-sub">All time records</p>
                </div>

                {/* Card 2: First Timers */}
                <div className="card">
                    <h4>First Timers</h4>
                    <p className="metric-value">
                        {firstTimerData.find(d => d.name === 'First Timers')?.value || 0}
                    </p>
                    <p className="metric-sub">New visitors</p>
                </div>

                {/* Card 3: Departments */}
                <div className="card">
                    <h4>Departments</h4>
                    <p className="metric-value">{deptData.length}</p>
                    <p className="metric-sub">Active departments</p>
                </div>
            </div>

            <div className="admin-card-grid" style={{ gridTemplateColumns: '1fr' }}>
                {/* Trend Chart */}
                <div className="card">
                    <h4>Attendance Trend</h4>
                    <div className="chart-container">
                        <ResponsiveContainer>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tickFormatter={(str) => {
                                        const d = new Date(str);
                                        return `${d.getMonth() + 1}/${d.getDate()}`;
                                    }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    label={{ value: 'Attendees', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#4f46e5' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="admin-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                {/* Gender Distribution */}
                <div className="card">
                    <h4>Gender Distribution</h4>
                    <div className="chart-container">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={genderData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {genderData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Member Type */}
                <div className="card">
                    <h4>Member Type</h4>
                    <div className="chart-container">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={firstTimerData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    dataKey="value"
                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                >
                                    {firstTimerData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#b91010ff' : '#4f46e5'} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Peak Hours & Departments */}
            <div className="admin-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                {/* Peak Hours Bar Chart */}
                <div className="card">
                    <h4>Peak Hours</h4>
                    <div className="chart-container">
                        <ResponsiveContainer>
                            <BarChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="time"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Department Bar Chart */}
                <div className="card">
                    <h4>Attendance by Department</h4>
                    <div className="chart-container">
                        <ResponsiveContainer>
                            <BarChart data={deptData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={100}
                                />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

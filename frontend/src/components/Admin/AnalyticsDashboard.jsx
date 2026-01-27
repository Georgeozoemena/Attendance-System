import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsDashboard({ attendanceData }) {
    // Process data for charts
    const { deptData, genderData, firstTimerData, trendData } = React.useMemo(() => {
        const dCounts = {};
        const gCounts = {};
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

            // Trend (by date)
            if (r.createdAt) {
                const dateKey = new Date(r.createdAt).toISOString().split('T')[0];
                tCounts[dateKey] = (tCounts[dateKey] || 0) + 1;
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

        return { deptData: dept, genderData: gender, firstTimerData: firstTimer, trendData: trend };
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

                {/* Card 3: Today's (Simulated based on latest date in data or just count) */}
                {/* For now, let's show Departments count as a metric */}
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

            {/* Department Bar Chart */}
            <div className="card mb-4" style={{ marginBottom: '24px' }}>
                <h4>Attendance by Department</h4>
                <div className="chart-container">
                    <ResponsiveContainer>
                        <BarChart data={deptData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="name"
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
                            <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

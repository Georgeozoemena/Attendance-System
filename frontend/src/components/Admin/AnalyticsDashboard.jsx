import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#0047AB', '#10b981', '#7c3aed', '#f59e0b', '#ef4444', '#06b6d4'];

export default function AnalyticsDashboard({ attendanceData }) {
    // Process data for charts
    const stats = React.useMemo(() => {
        if (!attendanceData.length) return null;

        const dCounts = {};
        const gCounts = {};
        const hCounts = {};
        const nCounts = {}; // Nationality
        const oCounts = {}; // Occupation
        const eCounts = {}; // Event participation
        const categoryCounts = { member: 0, worker: 0 };
        let ftYes = 0;
        let ftNo = 0;
        const tCounts = {};
        const weeklyRetention = { current: 0, previous: 0 };

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        attendanceData.forEach(r => {
            const d = r.department || 'General';
            dCounts[d] = (dCounts[d] || 0) + 1;

            const g = r.gender || 'Not Specified';
            gCounts[g] = (gCounts[g] || 0) + 1;

            const n = r.nationality || 'Not Specified';
            nCounts[n] = (nCounts[n] || 0) + 1;

            const o = r.occupation || 'Not Specified';
            oCounts[o] = (oCounts[o] || 0) + 1;

            const e = r.eventId || 'General';
            eCounts[e] = (eCounts[e] || 0) + 1;

            const cat = r.type === 'worker' ? 'worker' : 'member';
            categoryCounts[cat]++;

            if (r.firstTimer && r.firstTimer !== 'No') ftYes++; else ftNo++;

            const t = r.timestamp || r.createdAt;
            if (t) {
                const dateObj = new Date(t);
                const dateKey = dateObj.toISOString().split('T')[0];
                tCounts[dateKey] = (tCounts[dateKey] || 0) + 1;

                const hour = dateObj.getHours();
                const hourKey = `${hour.toString().padStart(2, '0')}:00`;
                hCounts[hourKey] = (hCounts[hourKey] || 0) + 1;

                if (dateObj > oneWeekAgo) weeklyRetention.current++;
                else if (dateObj > twoWeeksAgo) weeklyRetention.previous++;
            }
        });

        const dept = Object.keys(dCounts).map(k => ({ name: k, count: dCounts[k] })).sort((a, b) => b.count - a.count);
        const gender = Object.keys(gCounts).map(k => ({ name: k, value: gCounts[k] }));
        const nationality = Object.keys(nCounts).map(k => ({ name: k, value: nCounts[k] }))
            .sort((a, b) => b.value - a.value).slice(0, 5);
        const occupation = Object.keys(oCounts).map(k => ({ name: k, value: oCounts[k] }))
            .sort((a, b) => b.value - a.value).slice(0, 5);
        const events = Object.keys(eCounts).map(k => ({ name: k, count: eCounts[k] }))
            .sort((a, b) => b.count - a.count).slice(0, 5);

        const categoryData = [
            { name: 'Members', value: categoryCounts.member },
            { name: 'Workers', value: categoryCounts.worker },
        ];

        const firstTimerData = [
            { name: 'First Timers', value: ftYes },
            { name: 'Regulars', value: ftNo },
        ];
        const trend = Object.keys(tCounts).sort().map(k => ({ date: k, count: tCounts[k] }));
        const hourly = Object.keys(hCounts).sort().map(k => ({ time: k, count: hCounts[k] }));

        const growth = weeklyRetention.previous === 0 ? 100 :
            ((weeklyRetention.current - weeklyRetention.previous) / weeklyRetention.previous * 100).toFixed(1);

        return {
            deptData: dept,
            genderData: gender,
            firstTimerData,
            categoryData,
            nationalityData: nationality,
            occupationData: occupation,
            eventData: events,
            trendData: trend,
            hourlyData: hourly,
            growth
        };
    }, [attendanceData]);

    if (!stats) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>No Analytics Yet</h3>
                <p>Start recording attendance to see detailed insights and trends.</p>
            </div>
        );
    }

    const {
        deptData, genderData, firstTimerData, categoryData,
        nationalityData, occupationData, eventData,
        trendData, hourlyData, growth
    } = stats;

    return (
        <div className="analytics-container animate-fade-in">
            {/* Top Summaries */}
            <div className="admin-card-grid">
                <div className="stat-card">
                    <span className="stat-label">Total Attendance</span>
                    <div className="stat-value">{attendanceData.length}</div>
                    <div className="stat-sub">
                        <span className={growth >= 0 ? 'text-green' : 'text-red'}>
                            {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}%
                        </span> vs last week
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Worker Ratio</span>
                    <div className="stat-value">
                        {((categoryData[1].value / attendanceData.length) * 100).toFixed(1)}%
                    </div>
                    <div className="stat-sub">{categoryData[1].value} total workers</div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Peak Arrival</span>
                    <div className="stat-value">
                        {hourlyData.length ? hourlyData.reduce((prev, curr) => prev.count > curr.count ? prev : curr).time : '--'}
                    </div>
                    <div className="stat-sub">Busiest hour recorded</div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Engagement</span>
                    <div className="stat-value">{eventData.length}</div>
                    <div className="stat-sub">Recent active events</div>
                </div>
            </div>

            {/* Main Graphs */}
            <div className="analytics-charts-layout">
                {/* Trend Section */}
                <div className="data-table-card chart-full-width">
                    <div className="table-header">
                        <div className="table-header-left">
                            <h3>Attendance Growth Trend</h3>
                        </div>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--dc-blue)" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="var(--dc-blue)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: 'var(--text-3)' }}
                                    tickFormatter={(d) => {
                                        const date = new Date(d);
                                        return `${date.getMonth() + 1}/${date.getDate()}`;
                                    }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-3)' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--dc-blue)' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="var(--dc-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="analytics-grid-two">
                    {/* Distribution Graphs */}
                    <div className="data-table-card">
                        <div className="table-header"><h3>Member vs Worker</h3></div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={4}>
                                        <Cell fill="var(--dc-blue)" />
                                        <Cell fill="#fbbf24" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend iconType="circle" verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="data-table-card">
                        <div className="table-header"><h3>Status Distribution</h3></div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={firstTimerData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={4}>
                                        <Cell fill="#a855f7" />
                                        <Cell fill="var(--surface-3)" />
                                    </Pie>
                                    <Tooltip />
                                    <Legend iconType="circle" verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="analytics-grid-two alt-min">
                    <div className="data-table-card">
                        <div className="table-header"><h3>Top Occupations</h3></div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={occupationData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-1)' }} width={100} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="data-table-card">
                        <div className="table-header"><h3>Regional Distribution</h3></div>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={nationalityData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-1)' }} width={100} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="data-table-card chart-full-width">
                    <div className="table-header">
                        <div className="table-header-left">
                            <h3>Departmental Activity</h3>
                        </div>
                    </div>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={Math.max(250, deptData.length * 30)}>
                            <BarChart data={deptData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                                <Tooltip cursor={{ fill: 'var(--surface-2)' }} />
                                <Bar dataKey="count" fill="var(--dc-blue)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="data-table-card chart-full-width">
                    <div className="table-header"><h3>Top Participating Events</h3></div>
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Event ID</th>
                                    <th>Attendees</th>
                                    <th>Engagement</th>
                                </tr>
                            </thead>
                            <tbody>
                                {eventData.map((ev, idx) => (
                                    <tr key={idx}>
                                        <td className="code-cell">{ev.name}</td>
                                        <td><strong>{ev.count}</strong></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ flex: 1, height: '6px', background: 'var(--surface-3)', borderRadius: '3px' }}>
                                                    <div style={{
                                                        width: `${(ev.count / attendanceData.length) * 100}%`,
                                                        height: '100%',
                                                        background: COLORS[idx % COLORS.length],
                                                        borderRadius: '3px'
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '11px', minWidth: '35px' }}>
                                                    {((ev.count / attendanceData.length) * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

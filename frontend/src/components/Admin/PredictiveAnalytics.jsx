import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie
} from 'recharts';

export default function PredictiveAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPredictiveData = async () => {
            try {
                const adminKey = localStorage.getItem('adminKey');
                const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/analytics/predictive`, {
                    headers: { 'x-admin-key': adminKey }
                });
                if (resp.ok) {
                    const json = await resp.json();
                    setData(json);
                } else {
                    setError('Failed to load predictive data');
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };

        fetchPredictiveData();
    }, []);

    if (loading) return <div className="stat-card" style={{ padding: '40px', textAlign: 'center' }}>Loading predictive insights...</div>;
    if (error) return <div className="stat-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}>{error}</div>;
    if (!data) return null;

    const { forecast, peakTimes, trends } = data;

    return (
        <div className="predictive-analytics animate-fade-in" style={{ padding: '20px' }}>
            <div className="admin-card-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card highlighted" style={{ gridColumn: 'span 2' }}>
                    <div className="stat-card-top">
                        <span className="stat-label">
                            {forecast.upcomingEvent ? `Forecast: ${forecast.upcomingEvent.name}` : 'Upcoming Attendance Forecast'}
                        </span>
                        <div className="stat-icon amber">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="20" x2="12" y2="10" />
                                <line x1="18" y1="20" x2="18" y2="4" />
                                <line x1="6" y1="20" x2="6" y2="16" />
                            </svg>
                        </div>
                    </div>
                    <div className="stat-value" style={{ fontSize: '36px' }}>
                        {forecast.range[0]} – {forecast.range[1]}
                    </div>
                    <p className="stat-sub" style={{ fontSize: '14px', marginTop: '10px', color: 'var(--text-2)' }}>
                        {forecast.message}
                    </p>
                    {forecast.upcomingEvent && (
                        <div style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '4px', opacity: 0.8 }}>
                            Targeting historical <strong>{forecast.upcomingEvent.type}</strong> patterns
                        </div>
                    )}
                    <div style={{ marginTop: '16px', height: '4px', background: 'var(--amber-lt)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                            background: 'var(--amber)', 
                            margin: '0 auto', 
                            borderRadius: '2px'
                        }} />
                    </div>
                </div>

                {/* Peak Time Card */}
                <div className="stat-card" style={{ gridColumn: 'span 2' }}>
                    <div className="stat-card-top">
                        <span className="stat-label">Peak Check-in Windows</span>
                        <div className="stat-icon blue">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {peakTimes.length > 0 ? peakTimes.map((pt, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-2)' }}>{pt.time}</span>
                                <div style={{ flex: 1, margin: '0 12px', height: '4px', background: 'var(--surface-3)', borderRadius: '2px' }}>
                                    <div style={{ 
                                        width: `${(pt.count / peakTimes[0].count) * 100}%`, 
                                        height: '100%', 
                                        background: 'var(--dc-blue)', 
                                        borderRadius: '2px' 
                                    }} />
                                </div>
                                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{pt.count} check-ins</span>
                            </div>
                        )) : <p className="stat-sub">No peak data yet.</p>}
                    </div>
                </div>
            </div>

            {/* Trends Section */}
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-1)' }}>Trend Insights</h3>
            <div className="admin-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {trends.map((trend, idx) => (
                    <div key={idx} className="stat-card" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ 
                                padding: '6px', 
                                background: trend.type === 'growth' ? 'var(--green-lt)' : 'var(--dc-blue-lt)', 
                                borderRadius: '6px',
                                color: trend.type === 'growth' ? 'var(--green)' : 'var(--dc-blue)'
                            }}>
                                {trend.type === 'growth' ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                        <polyline points="17 6 23 6 23 12" />
                                    </svg>
                                ) : trend.type === 'conversion' ? (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <polyline points="16 11 18 13 22 9" />
                                    </svg>
                                ) : (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h4 style={{ fontSize: '13px', margin: 0 }}>{trend.label}</h4>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: trend.type === 'growth' && trend.value.startsWith('-') ? 'var(--red)' : 'var(--text-1)' }}>
                                    {trend.value}
                                </div>
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0 }}>{trend.message}</p>
                    </div>
                ))}
            </div>

            {/* Visualization - Forecast Distribution */}
            {peakTimes.length > 0 && (
                <div className="data-table-card" style={{ marginTop: '24px', padding: '20px' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>Peak Period Intensity</h3>
                    <div style={{ height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={peakTimes}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                                <YAxis hide />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-1)' }}
                                />
                                <Bar dataKey="count" fill="url(#blueGrad)" radius={[4, 4, 0, 0]}>
                                    <defs>
                                        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--dc-blue)" />
                                            <stop offset="100%" stopColor="rgba(0, 71, 171, 0.4)" />
                                        </linearGradient>
                                    </defs>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}

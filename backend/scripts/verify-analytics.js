/**
 * Verification Script for Predictive Analytics Logic
 * This script tests the core forecasting and trend detection logic.
 */

function calculateStats(values) {
    if (values.length === 0) return { avg: 0, std: 0 };
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / values.length);
    return { avg, std };
}

function testLogic() {
    console.log("--- Testing Predictive Analytics Logic ---");

    // Case 1: Increasing Attendance
    const turnouts = [100, 110, 125, 140];
    const { avg, std } = calculateStats(turnouts);
    const low = Math.max(0, Math.floor(avg - std));
    const high = Math.ceil(avg + std);
    
    console.log(`\nCase 1: Upward Trend ${JSON.stringify(turnouts)}`);
    console.log(`Average: ${avg.toFixed(2)}, StdDev: ${std.toFixed(2)}`);
    console.log(`Forecast Range: ${low} - ${high}`);
    
    const latest = turnouts[turnouts.length - 1];
    const prev = turnouts[turnouts.length - 2];
    const change = ((latest - prev) / prev * 100).toFixed(1);
    console.log(`Change relative to last event: ${change}% (Expected: +12.0%)`);

    // Case 2: Volatile Attendance
    const volatile = [50, 200, 75, 180];
    const volatileStats = calculateStats(volatile);
    console.log(`\nCase 2: Volatile Data ${JSON.stringify(volatile)}`);
    console.log(`Average: ${volatileStats.avg.toFixed(2)}, StdDev: ${volatileStats.std.toFixed(2)}`);
    console.log(`Forecast Range: ${Math.max(0, Math.floor(volatileStats.avg - volatileStats.std))} - ${Math.ceil(volatileStats.avg + volatileStats.std)}`);

    // Case 3: Empty Data
    const emptyStats = calculateStats([]);
    console.log(`\nCase 3: Empty Data`);
    console.log(`Stats: ${JSON.stringify(emptyStats)} (Expected avg: 0, std: 0)`);

    console.log("\n--- Verification Complete ---");
}

testLogic();

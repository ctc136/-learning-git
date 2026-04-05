import { config } from 'dotenv';
config({ path: '.env.local' });

export default async function handler(req, res) {
  const clientId = process.env.STRAVA_CLIENT_ID.replace(/^"|"$/g, '');
  const clientSecret = process.env.STRAVA_CLIENT_SECRET.replace(/^"|"$/g, '');
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN.replace(/^"|"$/g, '');

  console.log('STRAVA_CLIENT_ID:', clientId);
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Step 1: Refresh the access token
    console.log('Strava token refresh params:', {
      client_id: clientId,
      client_secret: clientSecret.slice(0, 4),
      refresh_token: refreshToken.slice(0, 4),
      grant_type: 'refresh_token',
    });

    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Number(clientId),
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Strava token refresh failed:', JSON.stringify(tokenData));
      throw new Error(`Token refresh failed: ${tokenData.message || tokenRes.status}`);
    }

    const accessToken = tokenData.access_token;

    // Step 2: Fetch last 90 days of activities
    const after = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60;
    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const activities = await activitiesRes.json();

    if (!activitiesRes.ok) {
      console.error('Strava activities fetch failed:', JSON.stringify(activities));
      throw new Error(`Activities fetch failed: ${activities.message || activitiesRes.status}`);
    }

    // Step 3: Filter runs only and calculate mileage
    const runs = activities.filter(a => a.type === 'Run');

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let weeklyMiles = 0;
    let monthlyMiles = 0;

    runs.forEach(run => {
      const date = new Date(run.start_date);
      const miles = run.distance / 1609.34;
      if (date >= startOfWeek) weeklyMiles += miles;
      if (date >= startOfMonth) monthlyMiles += miles;
    });

    // Build weekly miles breakdown for chart
    const weeklyMilesMap = new Map();
    runs.forEach(run => {
      const date = new Date(run.start_date);
      const daysFromMonday = (date.getDay() + 6) % 7;
      const ws = new Date(date);
      ws.setDate(date.getDate() - daysFromMonday);
      ws.setHours(0, 0, 0, 0);
      const key = ws.toISOString().split('T')[0];
      weeklyMilesMap.set(key, (weeklyMilesMap.get(key) || 0) + run.distance / 1609.34);
    });

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const firstWeek = new Date(ninetyDaysAgo);
    firstWeek.setDate(firstWeek.getDate() - (firstWeek.getDay() + 6) % 7);
    firstWeek.setHours(0, 0, 0, 0);

    const weeklyMilesData = [];
    const today = new Date();
    for (let d = new Date(firstWeek); d <= today; d.setDate(d.getDate() + 7)) {
      const key = d.toISOString().split('T')[0];
      weeklyMilesData.push({
        week: `${d.getMonth() + 1}/${d.getDate()}`,
        miles: Math.round((weeklyMilesMap.get(key) || 0) * 10) / 10,
      });
    }

    const totalMiles = Math.round(runs.reduce((s, r) => s + r.distance / 1609.34, 0) * 10) / 10;

    res.status(200).json({
      weeklyMiles: Math.round(weeklyMiles * 10) / 10,
      monthlyMiles: Math.round(monthlyMiles * 10) / 10,
      totalRuns: runs.length,
      totalMiles,
      weeklyMilesData,
      recentRuns: runs.slice(0, 5).map(r => ({
        name: r.name,
        date: r.start_date.split('T')[0],
        miles: Math.round((r.distance / 1609.34) * 10) / 10,
        movingTime: Math.round(r.moving_time / 60),
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
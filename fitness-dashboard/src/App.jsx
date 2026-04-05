import React, { useEffect, useState } from 'react';
import { subDays } from 'date-fns';
import { fetchAllWorkouts, fetchExerciseTemplates } from './api';
import {
  buildWeeklyFrequency,
  buildMuscleVolume,
  buildLastTrainedMap,
  getNeglectedMuscles,
  buildExerciseProgress,
  buildCoreData,
  lastCoreDateFromWorkouts,
  TRACKED_EXERCISE_DISPLAY,
} from './dataUtils';

import { Analytics } from '@vercel/analytics/react';
import WorkoutFrequency from './components/WorkoutFrequency';
import VolumeChart from './components/VolumeChart';
import NeglectedAlert from './components/NeglectedAlert';
import ExerciseChart from './components/ExerciseChart';
import CoreTracker from './components/CoreTracker';
import GamePlan from './components/GamePlan';
import Login from './components/Login';
import StravaSection from './components/StravaSection';

const DAYS = 90;

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [state, setState] = useState({ status: 'idle', workouts: [], templates: [] });
  const [error, setError] = useState(null);
  const [stravaState, setStravaState] = useState({ status: 'loading', data: null, error: null });

  function handleLogout() {
    localStorage.removeItem('auth_token');
    setToken(null);
  }

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setState((s) => ({ ...s, status: 'loading' }));

    const since = subDays(new Date(), DAYS);

    Promise.all([fetchAllWorkouts(since), fetchExerciseTemplates()])
      .then(([workouts, templates]) => {
        if (!cancelled) setState({ status: 'done', workouts, templates });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    fetch('/api/strava')
      .then(res => res.json())
      .then(json => {
        if (cancelled) return;
        if (json.error) throw new Error(json.error);
        setStravaState({ status: 'done', data: json, error: null });
      })
      .catch(err => {
        if (!cancelled) setStravaState({ status: 'error', data: null, error: err.message });
      });

    return () => { cancelled = true; };
  }, [token]);

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  const { status, workouts, templates } = state;

  const templateMap = new Map(templates.map((t) => [t.id, t]));

  const weeklyFreq = status === 'done' ? buildWeeklyFrequency(workouts, subDays(new Date(), DAYS)) : [];
  const muscleVolume = status === 'done' ? buildMuscleVolume(workouts, templateMap) : [];
  const lastTrained = status === 'done' ? buildLastTrainedMap(workouts, templateMap) : new Map();
  const neglected = status === 'done' ? getNeglectedMuscles(lastTrained) : [];
  const exerciseProgress = status === 'done' ? buildExerciseProgress(workouts) : new Map();
  const coreData = status === 'done' ? buildCoreData(workouts, templateMap) : [];
  const lastCoreDate = status === 'done' ? lastCoreDateFromWorkouts(workouts, templateMap) : null;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div>
          <h1 className="header-title">Fitness Dashboard</h1>
          <p className="header-subtitle">
            Last {DAYS} days · {workouts.length} workouts tracked via Hevy
            {stravaState.status === 'done' && stravaState.data
              ? ` · ${stravaState.data.totalRuns} runs, ${stravaState.data.totalMiles} mi via Strava`
              : null}
          </p>
        </div>
        <div className="header-right">
          {status === 'loading' && <span className="badge badge-loading">Syncing…</span>}
          {status === 'done' && <span className="badge badge-done">Live</span>}
          {error && <span className="badge badge-error">Error</span>}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Error state */}
      {error && (
        <div className="error-box">
          <strong>API Error:</strong> {error}
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94a3b8' }}>
            Check your API key and that the Hevy API supports CORS for browser requests.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {status === 'loading' && (
        <div className="loading-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" />
          ))}
        </div>
      )}

      {status === 'done' && (
        <>
          {/* ── Section 1: Overview Row ── */}
          <section>
            <h2 className="section-title">Lifting Overview</h2>
            <div className="grid-3">
              <WorkoutFrequency data={weeklyFreq} />
              <VolumeChart data={muscleVolume} />
              <NeglectedAlert neglected={neglected} recentRuns={stravaState.data?.recentRuns} />
            </div>
          </section>

          {/* ── Section 1b: Running (Strava) ── */}
          <section>
            <h2 className="section-title">Running Overview</h2>
            <p className="section-subtitle">Mileage and recent runs via Strava</p>
            <StravaSection
              data={stravaState.data}
              status={stravaState.status}
              error={stravaState.error}
            />
          </section>

          {/* ── Section 2: Exercise Progress ── */}
          <section>
            <h2 className="section-title">Exercise Progress</h2>
            <p className="section-subtitle">
              Volume (bars, left axis) · Max Weight + Reps (lines, right axis).
              Click a metric pill to toggle it.
            </p>
            <div className="grid-exercise">
              {TRACKED_EXERCISE_DISPLAY.map((name) => (
                <ExerciseChart
                  key={name}
                  name={name}
                  data={exerciseProgress.get(name) || []}
                />
              ))}
            </div>
          </section>

          {/* ── Section 3: Core Tracker ── */}
          <section>
            <h2 className="section-title">Core Training</h2>
            <CoreTracker data={coreData} lastCoreDate={lastCoreDate} />
          </section>

          {/* ── Section 4: AI Game Plan ── */}
          <section>
            <h2 className="section-title">Next Week's Game Plan</h2>
            <p className="section-subtitle">
              AI-generated weekly plan based on your actual Hevy data — volume, recency, and recent performance.
            </p>
            <GamePlan
              workouts={workouts}
              muscleVolume={muscleVolume}
              neglectedMuscles={neglected}
              weeklyFreq={weeklyFreq}
            />
          </section>
        </>
      )}

      <footer className="footer">
        Data from Hevy &amp; Strava · Dashboard built with React + Recharts · AI recommendations by Claude
      </footer>
      <Analytics />
    </div>
  );
}

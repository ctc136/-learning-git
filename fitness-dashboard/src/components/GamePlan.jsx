import React, { useState, useCallback } from 'react';
import { format } from 'date-fns';

// ─── Markdown parser ──────────────────────────────────────────────────────────
// Expects sections like:
//   **Monday — Push Day**
//   - Exercise: 3 × 10 @ 75 lbs
//   Notes: ...
function parsePlan(text) {
  // Split on bold day headings
  const parts = text.split(/(?=\*\*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))/i);

  return parts
    .map((section) => {
      const headingMatch = section.match(/\*\*(.*?)\s*—\s*(.*?)\*\*/);
      if (!headingMatch) return null;

      const day = headingMatch[1].trim();
      const focus = headingMatch[2].trim();
      const isRest = /rest/i.test(focus);

      const exercises = [];
      const noteLines = [];

      const body = section.replace(/\*\*.*?\*\*/, '').trim();
      for (const line of body.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('- ')) {
          exercises.push(trimmed.slice(2));
        } else {
          // Strip leading "Notes:" label if present
          noteLines.push(trimmed.replace(/^notes?:\s*/i, ''));
        }
      }

      return { day, focus, isRest, exercises, notes: noteLines.join(' ').trim() };
    })
    .filter(Boolean);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DayCard({ day, focus, isRest, exercises, notes }) {
  return (
    <div className={`day-card ${isRest ? 'day-card--rest' : ''}`}>
      <div className="day-card__header">
        <span className="day-card__day">{day}</span>
        <span className={`day-card__focus ${isRest ? 'day-card__focus--rest' : ''}`}>
          {focus}
        </span>
      </div>

      {isRest ? (
        <p className="day-card__rest-note">
          {exercises.length > 0 ? exercises.join(' ') : notes || 'Full rest — let your body recover.'}
        </p>
      ) : (
        <>
          <ul className="day-card__exercises">
            {exercises.map((ex, i) => {
              // Split "Exercise Name: 3 × 10 @ 75 lbs" into name + detail
              const colonIdx = ex.indexOf(':');
              const name = colonIdx > -1 ? ex.slice(0, colonIdx).trim() : ex;
              const detail = colonIdx > -1 ? ex.slice(colonIdx + 1).trim() : '';
              return (
                <li key={i} className="day-card__exercise">
                  <span className="day-card__ex-name">{name}</span>
                  {detail && (
                    <span className="day-card__ex-detail">{detail}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {notes && <p className="day-card__notes">{notes}</p>}
        </>
      )}
    </div>
  );
}

function StreamingView({ text }) {
  return (
    <div className="gp-streaming">
      <div className="gp-streaming__cursor-wrap">
        <pre className="gp-streaming__text">{text}</pre>
        <span className="gp-cursor" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function GamePlan({ workouts, muscleVolume, neglectedMuscles, weeklyFreq }) {
  const [status, setStatus] = useState('idle'); // idle | loading | streaming | done | error
  const [streamText, setStreamText] = useState('');
  const [days, setDays] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedAt, setGeneratedAt] = useState(null);

  const buildContext = useCallback(() => {
    // Average workouts per week
    const nonZeroWeeks = weeklyFreq.filter((w) => w.count > 0);
    const avgWorkoutsPerWeek =
      nonZeroWeeks.length > 0
        ? (nonZeroWeeks.reduce((s, w) => s + w.count, 0) / weeklyFreq.length).toFixed(1)
        : '3';

    // Last 3 workouts (newest first)
    const lastThree = [...workouts]
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 3)
      .map((w) => ({
        title: w.title,
        date: format(new Date(w.startTime), 'MMM d'),
        exercises: w.exercises.map((e) => ({
          name: e.title,
          sets: e.sets
            .filter((s) => s.type === 'normal')
            .map((s) => ({ reps: s.reps, weightLbs: s.weightLbs })),
        })),
      }));

    return {
      avgWorkoutsPerWeek,
      muscleVolume: muscleVolume.slice(0, 10),
      neglectedMuscles,
      lastThreeWorkouts: lastThree,
    };
  }, [workouts, muscleVolume, neglectedMuscles, weeklyFreq]);

  const generate = useCallback(async () => {
    setStatus('loading');
    setStreamText('');
    setDays([]);
    setErrorMsg('');

    const context = buildContext();

    try {
      const res = await fetch('/api/game-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('auth_token') || '',
        },
        body: JSON.stringify(context),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      setStatus('streaming');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        // SSE lines: "data: {...}\n\n"
        for (const line of raw.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;

          const parsed = JSON.parse(payload);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) {
            accumulated += parsed.text;
            setStreamText(accumulated);
          }
        }
      }

      const parsed = parsePlan(accumulated);
      setDays(parsed.length >= 5 ? parsed : []);
      setStreamText(parsed.length >= 5 ? '' : accumulated); // show raw if parse fails
      setGeneratedAt(new Date());
      setStatus('done');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }, [buildContext]);

  return (
    <div className="gp-section">
      {/* Header row */}
      <div className="gp-header">
        <div>
          {generatedAt && (
            <p className="gp-generated-at">
              Generated {format(generatedAt, 'MMM d @ h:mm a')} · claude-sonnet-4-0
            </p>
          )}
        </div>
        <button
          className={`gp-btn ${status === 'loading' || status === 'streaming' ? 'gp-btn--disabled' : ''}`}
          onClick={generate}
          disabled={status === 'loading' || status === 'streaming'}
        >
          {status === 'loading' && <span className="gp-spinner" />}
          {status === 'loading'
            ? 'Thinking…'
            : status === 'streaming'
            ? 'Generating…'
            : status === 'done' || status === 'error'
            ? '↺ Regenerate'
            : '✦ Generate Game Plan'}
        </button>
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="gp-error">
          <strong>Error:</strong> {errorMsg}
          {errorMsg.includes('ANTHROPIC_API_KEY') && (
            <p style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>
              Add <code>ANTHROPIC_API_KEY</code> in your Vercel project's Environment Variables settings.
            </p>
          )}
        </div>
      )}

      {/* Idle state */}
      {status === 'idle' && (
        <div className="gp-idle">
          <p>Click <strong>Generate Game Plan</strong> to get a personalised 7-day workout recommendation based on your Hevy history.</p>
        </div>
      )}

      {/* Loading pulse */}
      {status === 'loading' && (
        <div className="gp-loading">
          <div className="gp-loading__dots">
            <span /><span /><span />
          </div>
          <p>Analysing your workout history…</p>
        </div>
      )}

      {/* Live stream */}
      {status === 'streaming' && <StreamingView text={streamText} />}

      {/* Done — day cards or raw text fallback */}
      {status === 'done' && (
        <>
          {days.length > 0 ? (
            <div className="gp-cards">
              {days.map((d, i) => (
                <DayCard key={i} {...d} />
              ))}
            </div>
          ) : (
            <div className="gp-raw card">
              <pre>{streamText}</pre>
            </div>
          )}

          <p className="gp-disclaimer">
            AI-generated suggestions based on your Hevy history. Adjust weights as needed.
          </p>
        </>
      )}
    </div>
  );
}

function getToken() {
  return localStorage.getItem('auth_token') || '';
}

async function get(path) {
  // path is like "/workouts?page=1&pageSize=10"
  // Proxy through our serverless function at /api/hevy
  const [pathname, search] = path.split('?');
  const endpoint = pathname.replace(/^\//, ''); // e.g. "workouts"
  const params = new URLSearchParams(search || '');
  params.set('endpoint', endpoint);

  const res = await fetch(`/api/hevy?${params.toString()}`, {
    headers: { 'x-auth-token': getToken() },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hevy API ${res.status}: ${text}`);
  }
  return res.json();
}

// Hevy REST API uses snake_case. We normalise everything to camelCase
// after fetching so the rest of the app doesn't have to care.
function normaliseWorkout(w) {
  return {
    id: w.id,
    title: w.title || '',
    startTime: w.start_time || w.startTime || '',
    endTime: w.end_time || w.endTime || '',
    exercises: (w.exercises || []).map(normaliseExercise),
  };
}

function normaliseExercise(e) {
  return {
    index: e.index,
    title: e.title || e.name || '',
    exerciseTemplateId: e.exercise_template_id || e.exerciseTemplateId || '',
    sets: (e.sets || []).map(normaliseSet),
  };
}

function normaliseSet(s) {
  // Weight comes in kg; convert to lbs for display
  const kg = s.weight_kg ?? s.weight ?? 0;
  return {
    index: s.index,
    type: s.set_type || s.type || 'normal',
    weightLbs: kg * 2.20462,
    reps: s.reps || 0,
  };
}

function normaliseTemplate(t) {
  return {
    id: t.id,
    title: t.title || t.name || '',
    primaryMuscleGroup: t.primary_muscle_group || t.primaryMuscleGroup || 'other',
    secondaryMuscleGroups:
      t.secondary_muscle_groups || t.secondaryMuscleGroups || [],
    equipment: t.equipment || '',
    isCustom: t.is_custom || t.isCustom || false,
  };
}

export async function fetchAllWorkouts(since) {
  const workouts = [];
  let page = 1;
  const pageSize = 10;

  while (true) {
    const data = await get(`/workouts?page=${page}&pageSize=${pageSize}`);
    const batch = data.workouts || [];
    if (batch.length === 0) break;

    let hitCutoff = false;
    for (const w of batch) {
      const date = new Date(w.start_time || w.startTime || 0);
      if (date < since) { hitCutoff = true; break; }
      workouts.push(normaliseWorkout(w));
    }

    const pageCount = data.page_count ?? data.pageCount ?? 1;
    if (hitCutoff || page >= pageCount || batch.length < pageSize) break;
    page++;
  }

  return workouts;
}

export async function fetchExerciseTemplates() {
  const templates = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const data = await get(`/exercise_templates?page=${page}&pageSize=${pageSize}`);
    const batch = data.exercise_templates || data.exerciseTemplates || [];
    templates.push(...batch.map(normaliseTemplate));
    const pageCount = data.page_count ?? data.pageCount ?? 1;
    if (page >= pageCount || batch.length < pageSize) break;
    page++;
  }

  return templates;
}

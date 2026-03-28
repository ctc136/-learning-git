import { startOfWeek, format, subDays, eachWeekOfInterval, isAfter } from 'date-fns';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getWorkoutDate(w) {
  return new Date(w.startTime);
}

function setVolume(set) {
  return set.weightLbs * set.reps;
}

function exerciseVolume(exercise) {
  return exercise.sets.reduce((sum, s) => sum + setVolume(s), 0);
}

function exerciseMaxWeight(exercise) {
  return Math.max(0, ...exercise.sets.map((s) => s.weightLbs));
}

function exerciseTotalReps(exercise) {
  return exercise.sets.reduce((sum, s) => sum + s.reps, 0);
}

// ─── Muscle group resolution ─────────────────────────────────────────────────

// Fallback name→muscle heuristics for when template data is absent
const NAME_MUSCLE_MAP = [
  [/(bench|chest fly|pec|push.?up|incline press)/i, 'chest'],
  [/(pull.?up|lat pull|row|pulldown|pull down)/i, 'lats'],
  [/(deadlift|rdl|romanian|back extension|good morning)/i, 'lower_back'],
  [/(squat|leg press|lunge|bulgarian|hack squat|step.?up)/i, 'quadriceps'],
  [/(hamstring|leg curl|nordic|stiff.?leg)/i, 'hamstrings'],
  [/(glute|hip thrust|hip extension|clamshell|donkey)/i, 'glutes'],
  [/(curl|hammer curl|preacher|concentration curl)/i, 'biceps'],
  [/(tricep|skull|dip|pushdown|overhead ext|close grip)/i, 'triceps'],
  [/(shoulder|lateral raise|ohp|overhead press|arnold|face pull|rear delt)/i, 'shoulders'],
  [/(calf|standing calf|seated calf)/i, 'calves'],
  [/(plank|crunch|sit.?up|ab |core|dead bug|hollow|flutter|leg raise|russian twist|pallof|cable crunch|ab wheel|rollout|ball slam)/i, 'abdominals'],
  [/(trap|shrug|upright row)/i, 'traps'],
  [/(forearm|wrist)/i, 'forearms'],
];

export const MUSCLE_LABELS = {
  chest: 'Chest',
  lats: 'Back / Lats',
  lower_back: 'Lower Back',
  upper_back: 'Upper Back',
  quadriceps: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  biceps: 'Biceps',
  triceps: 'Triceps',
  shoulders: 'Shoulders',
  calves: 'Calves',
  abdominals: 'Core / Abs',
  traps: 'Traps',
  forearms: 'Forearms',
  cardio: 'Cardio',
  full_body: 'Full Body',
  other: 'Other',
};

export const MUSCLE_COLORS = {
  chest: '#ef4444',
  lats: '#3b82f6',
  lower_back: '#60a5fa',
  upper_back: '#93c5fd',
  quadriceps: '#10b981',
  hamstrings: '#34d399',
  glutes: '#ec4899',
  biceps: '#06b6d4',
  triceps: '#f97316',
  shoulders: '#8b5cf6',
  calves: '#84cc16',
  abdominals: '#f59e0b',
  traps: '#a78bfa',
  forearms: '#fb923c',
  cardio: '#94a3b8',
  full_body: '#cbd5e1',
  other: '#475569',
};

function resolveMuscle(exercise, templateMap) {
  const tmpl = templateMap.get(exercise.exerciseTemplateId);
  if (tmpl?.primaryMuscleGroup) return tmpl.primaryMuscleGroup;

  for (const [re, muscle] of NAME_MUSCLE_MAP) {
    if (re.test(exercise.title)) return muscle;
  }
  return 'other';
}

// ─── Workout frequency by week ───────────────────────────────────────────────

export function buildWeeklyFrequency(workouts, since) {
  const now = new Date();
  const weeks = eachWeekOfInterval({ start: since, end: now }, { weekStartsOn: 1 });

  const countMap = new Map();
  weeks.forEach((w) => countMap.set(format(w, 'MMM d'), 0));

  workouts.forEach((w) => {
    const weekStart = startOfWeek(getWorkoutDate(w), { weekStartsOn: 1 });
    const key = format(weekStart, 'MMM d');
    if (countMap.has(key)) countMap.set(key, countMap.get(key) + 1);
  });

  return Array.from(countMap.entries()).map(([week, count]) => ({ week, count }));
}

// ─── Volume by muscle group ───────────────────────────────────────────────────

export function buildMuscleVolume(workouts, templateMap) {
  const volumeMap = new Map();

  workouts.forEach((w) => {
    w.exercises.forEach((e) => {
      const muscle = resolveMuscle(e, templateMap);
      const vol = exerciseVolume(e);
      volumeMap.set(muscle, (volumeMap.get(muscle) || 0) + vol);
    });
  });

  return Array.from(volumeMap.entries())
    .map(([muscle, volume]) => ({
      muscle,
      label: MUSCLE_LABELS[muscle] || muscle,
      volume: Math.round(volume),
      color: MUSCLE_COLORS[muscle] || MUSCLE_COLORS.other,
    }))
    .sort((a, b) => b.volume - a.volume);
}

// ─── Last-trained date per muscle group ──────────────────────────────────────

export function buildLastTrainedMap(workouts, templateMap) {
  const lastMap = new Map();

  // workouts are newest-first from the API
  workouts.forEach((w) => {
    const date = getWorkoutDate(w);
    w.exercises.forEach((e) => {
      const muscle = resolveMuscle(e, templateMap);
      if (!lastMap.has(muscle)) lastMap.set(muscle, date);
    });
  });

  return lastMap;
}

export function getNeglectedMuscles(lastTrainedMap, thresholdDays = 7) {
  const cutoff = subDays(new Date(), thresholdDays);
  const neglected = [];

  for (const [muscle, date] of lastTrainedMap.entries()) {
    if (!isAfter(date, cutoff)) {
      const daysSince = Math.floor((new Date() - date) / 86400000);
      neglected.push({ muscle, label: MUSCLE_LABELS[muscle] || muscle, daysSince });
    }
  }

  // Only surface meaningful muscle groups (skip "other" / "cardio")
  return neglected
    .filter((m) => !['other', 'cardio', 'full_body'].includes(m.muscle))
    .sort((a, b) => b.daysSince - a.daysSince);
}

// ─── Exercise progress over time ──────────────────────────────────────────────

const TARGET_EXERCISES = [
  'Bench Press (Dumbbell)',
  'Chest Supported Incline Row (Dumbbell)',
  'Chest Support Incline Row (Dumbbell)',
  'Chest Fly (Dumbbell)',
  'Skullcrusher (Dumbbell)',
  'Skull Crusher (Dumbbell)',
  'Push Up',
  'Push-Up',
  'Pull Up',
  'Pull-Up',
];

// Canonical display names (maps variant spellings → display name)
const EXERCISE_DISPLAY_NAMES = {
  'Bench Press (Dumbbell)': 'DB Bench Press',
  'Chest Supported Incline Row (Dumbbell)': 'Chest-Supported Row',
  'Chest Support Incline Row (Dumbbell)': 'Chest-Supported Row',
  'Chest Fly (Dumbbell)': 'DB Chest Fly',
  'Skullcrusher (Dumbbell)': 'Skullcrushers',
  'Skull Crusher (Dumbbell)': 'Skullcrushers',
  'Push Up': 'Push-Ups',
  'Push-Up': 'Push-Ups',
  'Pull Up': 'Pull-Ups',
  'Pull-Up': 'Pull-Ups',
};

// The 6 canonical names the UI will display, deduped
export const TRACKED_EXERCISE_DISPLAY = [
  'DB Bench Press',
  'Chest-Supported Row',
  'DB Chest Fly',
  'Skullcrushers',
  'Push-Ups',
  'Pull-Ups',
];

function normaliseExerciseName(name) {
  return EXERCISE_DISPLAY_NAMES[name] || null;
}

export function buildExerciseProgress(workouts) {
  // Map: displayName → [{ date, volume, maxWeight, totalReps }]
  const progressMap = new Map();
  TRACKED_EXERCISE_DISPLAY.forEach((n) => progressMap.set(n, []));

  // workouts sorted newest-first; we want oldest-first for the chart
  const sorted = [...workouts].sort(
    (a, b) => new Date(a.startTime) - new Date(b.startTime)
  );

  sorted.forEach((w) => {
    const dateLabel = format(getWorkoutDate(w), 'MMM d');
    w.exercises.forEach((e) => {
      const displayName = normaliseExerciseName(e.title);
      if (!displayName) return;
      if (!progressMap.has(displayName)) return;

      const volume = Math.round(exerciseVolume(e));
      const maxWeight = Math.round(exerciseMaxWeight(e));
      const totalReps = exerciseTotalReps(e);

      progressMap.get(displayName).push({ date: dateLabel, volume, maxWeight, totalReps });
    });
  });

  return progressMap;
}

// ─── Core tracking ────────────────────────────────────────────────────────────

const CORE_RE = /plank|crunch|sit.?up|ab |core|dead bug|hollow|flutter|leg raise|russian twist|pallof|cable crunch|ab wheel|rollout|ball slam|toe touch|bicycle|side bend|hyperextension/i;

export function isCoreExercise(exerciseName, templateMap, templateId) {
  if (CORE_RE.test(exerciseName)) return true;
  const tmpl = templateMap.get(templateId);
  if (tmpl?.primaryMuscleGroup === 'abdominals') return true;
  return false;
}

export function buildCoreData(workouts, templateMap) {
  const dailyMap = new Map(); // date string → count of core sets

  workouts.forEach((w) => {
    const dateLabel = format(getWorkoutDate(w), 'MMM d');
    w.exercises.forEach((e) => {
      if (!isCoreExercise(e.title, templateMap, e.exerciseTemplateId)) return;
      const sets = e.sets.length;
      dailyMap.set(dateLabel, (dailyMap.get(dateLabel) || 0) + sets);
    });
  });

  const sorted = [...workouts]
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  // Build array with all workout days (not just core days) so gaps are visible
  const seen = new Set();
  const result = [];
  sorted.forEach((w) => {
    const dateLabel = format(getWorkoutDate(w), 'MMM d');
    if (seen.has(dateLabel)) return;
    seen.add(dateLabel);
    result.push({ date: dateLabel, sets: dailyMap.get(dateLabel) || 0 });
  });

  return result;
}

export function lastCoreDateFromWorkouts(workouts, templateMap) {
  const sorted = [...workouts].sort(
    (a, b) => new Date(b.startTime) - new Date(a.startTime)
  );

  for (const w of sorted) {
    for (const e of w.exercises) {
      if (isCoreExercise(e.title, templateMap, e.exerciseTemplateId)) {
        return getWorkoutDate(w);
      }
    }
  }
  return null;
}

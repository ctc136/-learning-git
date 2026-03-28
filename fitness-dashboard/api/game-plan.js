import Anthropic from '@anthropic-ai/sdk';

const systemPrompt = `You are a personal trainer analyzing a user's workout history from the Hevy app.
The user runs 2-3 times per week which is NOT tracked in Hevy, so do not flag legs as neglected.
They want to improve core strength and fix any muscle imbalances.
Based on the data provided, suggest a specific workout plan for the next 7 days.
For each workout day, list the exercises, sets, reps, and weights based on their recent performance.
Be specific and progressive — slightly increase volume or weight where appropriate.

Format your response EXACTLY like this, one section per day, no deviations:

**Monday — Push Day**
- Exercise Name: 3 × 10 @ 75 lbs
- Exercise Name: 4 × 8 @ 60 lbs
Notes: any day-level note here.

**Tuesday — Rest**
Active recovery suggestion.

Continue for all 7 days. Use the user's actual exercise names where possible.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    return;
  }

  const body = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const client = new Anthropic({ apiKey });

    const userMessage = `Here is my workout data for the last 90 days:

AVERAGE WORKOUTS PER WEEK: ${body.avgWorkoutsPerWeek}

VOLUME BY MUSCLE GROUP (total lbs lifted):
${body.muscleVolume.map(m => `  ${m.label}: ${m.volume.toLocaleString()} lbs`).join('\n')}

MUSCLE GROUPS NOT TRAINED IN 7+ DAYS:
${body.neglectedMuscles.length ? body.neglectedMuscles.map(m => `  ${m.label} (${m.daysSince} days)`).join('\n') : '  None — all groups trained recently'}

LAST 3 WORKOUTS:
${body.lastThreeWorkouts.map(w => `
${w.title} (${w.date}):
${w.exercises.map(e => `  • ${e.name}: ${e.sets.map(s => `${s.reps} reps @ ${Math.round(s.weightLbs)} lbs`).join(', ')}`).join('\n')}`).join('\n')}`;

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-0',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        const payload = JSON.stringify({ text: event.delta.text });
        res.write(`data: ${payload}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}

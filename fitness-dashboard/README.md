# Fitness Dashboard

A personal fitness analytics dashboard that pulls your workout history from the [Hevy](https://www.hevyapp.com/) app and surfaces trends, muscle imbalances, and an AI-generated weekly training plan powered by Claude.

---

## Features

| Section | Description |
|---|---|
| **Workout Frequency** | Bar chart showing how many workouts you logged each week over the last 90 days |
| **Volume by Muscle Group** | Total weight lifted per muscle group so you can spot imbalances at a glance |
| **Neglected Muscle Alerts** | Flags any muscle groups you haven't trained in 7+ days |
| **Exercise Progress** | Per-exercise charts tracking volume, max weight, and rep counts over time |
| **Core Tracker** | Dedicated view of your core training frequency and last session date |
| **AI Game Plan** | Claude-powered weekly workout plan generated from your real Hevy data — progressive overload built in |

---

## Tech Stack

- **React 18** — UI framework
- **Vite 5** — dev server and build tool
- **Recharts** — charts and data visualization
- **date-fns** — date math and formatting
- **Hevy REST API** — workout data source
- **Anthropic Claude API** — AI game plan generation (proxied server-side through Vite so the API key never hits the browser)

---

## Project Structure

```
fitness-dashboard/
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Root component, data fetching, layout
│   ├── api.js                # Hevy API client (pagination, normalisation kg→lbs)
│   ├── dataUtils.js          # Data transforms (volume, frequency, neglected muscles)
│   ├── App.css               # Global styles
│   └── components/
│       ├── WorkoutFrequency.jsx   # Weekly frequency bar chart
│       ├── VolumeChart.jsx        # Muscle group volume chart
│       ├── NeglectedAlert.jsx     # Neglected muscle group alerts
│       ├── ExerciseChart.jsx      # Per-exercise progress chart
│       ├── CoreTracker.jsx        # Core training tracker
│       └── GamePlan.jsx           # AI weekly game plan
├── vite.config.js            # Vite config + Anthropic SSE proxy middleware
├── package.json
└── index.html
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A [Hevy](https://www.hevyapp.com/) account with an API key
- An [Anthropic](https://console.anthropic.com/) API key (for the AI game plan feature)

---

## Setup

1. **Clone the repo**

   ```bash
   git clone <your-repo-url>
   cd fitness-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a `.env` file** in the project root with your API keys:

   ```env
   VITE_HEVY_API_KEY=your_hevy_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

   > **Note:** `VITE_HEVY_API_KEY` is exposed to the browser. `ANTHROPIC_API_KEY` is server-side only — the Vite dev proxy ensures it never reaches the client.

4. **Get your Hevy API key**
   - Open the Hevy app → Profile → Settings → API
   - Copy your key and paste it into `.env`

---

## Running the App

**Development (with hot reload):**

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

**Production build:**

```bash
npm run build
```

**Preview the production build locally:**

```bash
npm run preview
```

---

## How the AI Game Plan Works

When you click **Generate Game Plan**, the app sends a summary of your last 90 days of workout data to `/api/game-plan` — a local Vite middleware that proxies the request to the Anthropic API server-side. The response streams back as Server-Sent Events (SSE) and renders in real time. The prompt instructs Claude to account for muscle group volume, recency, and your last three workouts when building a progressive 7-day plan.

---

## Notes

- Workout weights are stored in **kg** by the Hevy API and converted to **lbs** for display.
- Running and cardio logged outside Hevy will not appear in the dashboard — leg and cardio volume will look lower than your actual activity.
- This app is intended for **local personal use**. Do not deploy it publicly without moving the Hevy API key to a backend proxy as well.

# Mapty

Mapty is a lightweight front-end project for logging running and cycling
workouts on an interactive map. The interface currently displays a localized
Vietnamese UI while maintaining the core layout from Jonas Schmedtmann's course
materials.

## Features

- Sidebar form for entering workout details such as distance, duration, cadence,
  and elevation gain.
- Responsive layout composed of a workout list and full-height map container.
- Localized month names and UI labels to support Vietnamese users.
- Built with Vite for a fast development workflow.

## Getting Started

```bash
npm install
npm run dev
```

The development server prints a local URL where you can preview the app. Changes
in `src` or `index.html` reload automatically.

## Available Scripts

- `npm run dev` – start the Vite development server.
- `npm run build` – produce an optimized production build in `dist/`.
- `npm run preview` – preview the production build locally.

## Project Structure

- `index.html` – top-level markup and sidebar form.
- `src/style.css` – component styling and layout rules.
- `src/main.js` – DOM references and future application logic.
- `public/` – static assets such as the favicon and logo.

## Credits

Original design and learning materials by Jonas Schmedtmann. Localized and
adapted for practice purposes.

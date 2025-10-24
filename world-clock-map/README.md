# World Clock Map

A responsive React application that pairs an interactive world map with a live-updating list of city clocks. The interface is powered by [Leaflet](https://leafletjs.com/) for mapping and the browser `Intl.DateTimeFormat` API for accurate timezone calculations.

## Quick start

```bash
npm install
npm run dev
```

The development server runs on [http://localhost:5173](http://localhost:5173). Click any city marker to add it to the world clock list. Remove a city from the list and click its marker again to re-add it.

## Features

- Interactive world map with tooltips for each predefined city (New York, London, Tokyo, Sydney, Los Angeles, Cape Town, Rio de Janeiro and Dubai).
- Live local time, date and timezone data for every tracked city, refreshed once per second via a shared timer.
- 12-hour / 24-hour format toggle that updates every clock simultaneously.
- Removable clock cards arranged in a responsive grid for quick comparison.
- Clean layout that keeps the map above the clock list on all screen sizes.

## Available scripts

- `npm run dev` – start the local development server.
- `npm run build` – create an optimized production bundle.
- `npm run lint` – run ESLint on the project sources.

## Notes

- Leaflet’s default marker assets are bundled automatically; no extra configuration is required when deploying the built output.
- The world clock list is pre-populated with four cities so all required data points are demonstrated immediately.

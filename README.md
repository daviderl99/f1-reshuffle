# F1 Reshuffle

Recalculate F1 championship standings with any driver removed. Live data, every season since 1950.

Built with Vite, React and TypeScript. Data comes from the Jolpica F1 API.

## Run it

```bash
npm install
npm run dev        # development server
npm run build      # production build in dist/
npm run typecheck  # optional type check
```

## Structure

```
src/
  api.ts              fetches and caches season results (paged, with retry)
  scoring.ts          rescoring logic, standings, row ordering
  types.ts            shared types
  format.ts           number formatting
  App.tsx             state, loading, layout
  components/
    DriversTable.tsx
    TeamsTable.tsx
    RacesTable.tsx
  index.css
```

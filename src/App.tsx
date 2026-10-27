import { useCallback, useEffect, useMemo, useState } from "react";
import { loadSeason } from "./api";
import { compute, slotOrder } from "./scoring";
import type { SeasonData } from "./types";
import DriversTable from "./components/DriversTable";
import TeamsTable from "./components/TeamsTable";
import RacesTable from "./components/RacesTable";

type Tab = "drivers" | "teams" | "races";
const NOW = new Date().getFullYear();
const TABS: [Tab, string][] = [
  ["drivers", "Drivers"],
  ["teams", "Constructors"],
  ["races", "Race winners"],
];

export default function App() {
  const [year, setYear] = useState(NOW);
  const [data, setData] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("drivers");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setData(null);
    setExcluded(new Set());
    loadSeason(year)
      .then((d) => {
        if (cancelled) return;
        // Default to the previous season if the current one hasn't started yet.
        if (!d.races.length && year === NOW) {
          setYear(NOW - 1);
          return;
        }
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(
          e.message && e.message !== "Failed to fetch"
            ? e.message
            : "Could not reach the F1 data service. Check your connection and try again.",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const base = useMemo(() => (data ? compute(data, new Set()) : null), [data]);
  const recalculatedStandings = useMemo(
    () => (data ? compute(data, excluded) : null),
    [data, excluded],
  );
  const baseDrivers = useMemo(
    () => new Map(base?.drivers.map((d) => [d.id, d]) ?? []),
    [base],
  );
  const baseTeams = useMemo(
    () => new Map(base?.teams.map((t) => [t.id, t]) ?? []),
    [base],
  );

  const toggle = useCallback((id: string, include: boolean) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (include) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const hasRaces = !!data && data.races.length > 0;
  const seasonOngoing =
    !!data &&
    data.totalRounds !== null &&
    data.races.length < data.totalRounds &&
    year === NOW;
  const changed = excluded.size > 0;

  let status = "";
  if (loading) status = "";
  else if (error) status = error;
  else if (data && !hasRaces) status = `No race results for ${year} yet.`;
  else if (data) {
    const latestRace = data.races[data.races.length - 1];
    status = `${year} season · ${data.races.length} race${data.races.length > 1 ? "s" : ""} completed, latest: ${latestRace.name}.`;
  }

  let note = null;
  if (changed && base && recalculatedStandings && data) {
    const names = base.drivers
      .filter((d) => excluded.has(d.id))
      .map((d) => d.name)
      .join(", ");
    const champ = recalculatedStandings.drivers[0];
    const was = base.drivers[0];
    note = (
      <div className="note">
        <b>
          {excluded.size} driver{excluded.size > 1 ? "s" : ""} removed
        </b>{" "}
        ({names}). All {data.races.length} races have been rescored. <br />
        {champ && was && champ.id !== was.id ? (
          <>
            <b>{champ.name}</b> becomes{" "}
            {seasonOngoing ? "championship leader" : "champion"}.
          </>
        ) : champ ? (
          <>
            <b>{champ.name}</b> is still{" "}
            {seasonOngoing ? "the championship leader" : "champion"}.
          </>
        ) : null}
      </div>
    );
  }

  const years: number[] = [];
  for (let y = NOW; y >= 1950; y--) years.push(y);

  return (
    <div className="wrap">
      <header>
        <h1>F1 Standings Recalculator</h1>
        <p>
          Live championship tables, rebuilt race by race. Untick a driver and
          every result behind them moves up a place.
        </p>
      </header>

      <div className="bar">
        <label>
          Season{" "}
          <select
            aria-label="Season"
            value={year}
            onChange={(e) => setYear(+e.target.value)}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        {changed && (
          <button type="button" onClick={() => setExcluded(new Set())}>
            Restore all drivers
          </button>
        )}
        <div className="tabs" role="tablist">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              className="tab"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className={"status" + (error ? " err" : "")}
        role="status"
        aria-live="polite"
      >
        {loading ? (
          <>
            <span className="spinner" />
            Loading {year} results…
          </>
        ) : (
          status
        )}
      </div>
      {note}

      {hasRaces && base && recalculatedStandings && (
        <div className="panel">
          {tab === "drivers" && (
            <DriversTable
              slots={slotOrder(
                base.drivers,
                recalculatedStandings.drivers,
                excluded,
              )}
              baseById={baseDrivers}
              onToggle={toggle}
            />
          )}
          {tab === "teams" && (
            <TeamsTable
              teams={recalculatedStandings.teams}
              baseById={baseTeams}
            />
          )}
          {tab === "races" && (
            <RacesTable races={recalculatedStandings.races} />
          )}
        </div>
      )}

      <footer>
        Data: Jolpica F1 API (Ergast successor), fetched live in your browser.
        Points for each race are taken from the points that race actually
        awarded to each finishing position (so half-points races, double-points
        finales and sprint scoring carry through). Sprint points are included.
        Historic rules such as dropped results and shared drives are not
        modelled, and constructors’ tables before 1958 were unofficial.
      </footer>
    </div>
  );
}

import type { Race, Row, SeasonData } from "./types";

const API = "https://api.jolpi.ca/ergast/f1";
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const cache = new Map<number, Promise<SeasonData>>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

async function getJSON(url: string, tries = 4): Promise<Json> {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url);
    if (r.ok) return r.json();
    if (r.status === 429 || r.status >= 500) {
      await sleep(1200 * (i + 1));
      continue;
    }
    throw new Error("The F1 data service returned HTTP " + r.status + ".");
  }
  throw new Error("The F1 data service is busy. Wait a moment and try again.");
}

function norm(x: Json): Row {
  const d = x.Driver;
  return {
    pos: +x.position,
    id: d.driverId,
    name: d.givenName + " " + d.familyName,
    code: d.code || d.familyName.slice(0, 3).toUpperCase(),
    tid: x.Constructor.constructorId,
    tname: x.Constructor.name,
    pts: +x.points,
    fl: x.FastestLap ? +x.FastestLap.rank : null,
  };
}

interface Partial {
  round: number;
  name: string;
  date: string;
  rows: Row[];
}

async function fetchPaged(
  year: number,
  kind: "results" | "sprint",
): Promise<Map<number, Partial>> {
  const map = new Map<number, Partial>();
  let offset = 0;
  let total = Infinity;
  while (offset < total) {
    const m = (
      await getJSON(`${API}/${year}/${kind}.json?limit=100&offset=${offset}`)
    ).MRData;
    total = +m.total;
    if (!m.RaceTable.Races.length) break;
    for (const race of m.RaceTable.Races) {
      const k = +race.round;
      if (!map.has(k))
        map.set(k, {
          round: k,
          name: race.raceName,
          date: race.date,
          rows: [],
        });
      for (const x of race.Results || race.SprintResults || [])
        map.get(k)!.rows.push(norm(x));
    }
    offset += 100;
  }
  return map;
}

async function fetchSeason(year: number): Promise<SeasonData> {
  const [res, spr, totalRounds] = await Promise.all([
    fetchPaged(year, "results"),
    fetchPaged(year, "sprint").catch(() => new Map<number, Partial>()),
    getJSON(`${API}/${year}.json?limit=1`).then(
      (j: Json) => +j.MRData.total,
      () => null,
    ),
  ]);
  const races: Race[] = [...res.values()]
    .sort((a, b) => a.round - b.round)
    .map((r) => ({
      ...r,
      sprint: spr.has(r.round) ? spr.get(r.round)!.rows : null,
    }));
  return { year, races, totalRounds };
}

export function loadSeason(year: number): Promise<SeasonData> {
  let p = cache.get(year);
  if (!p) {
    p = fetchSeason(year);
    cache.set(year, p);
    p.catch(() => cache.delete(year));
  }
  return p;
}

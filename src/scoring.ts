import type {
  Computed, DriverStanding, Row, Scored, SeasonData, Slot, TeamStanding
} from './types';

// Re-score one session: remaining drivers inherit the points slot of the place they now occupy.
function scoreSession(rows: Row[], excluded: Set<string>, flBonus: boolean): Scored[] {
  const sorted = [...rows].sort((a, b) => a.pos - b.pos);
  const slots = sorted.map(r => r.pts - (flBonus && r.fl === 1 && r.pos <= 10 ? 1 : 0));
  const rem = sorted.filter(r => !excluded.has(r.id));
  const out: Scored[] = rem.map((r, i) => ({
    ...r,
    newPos: i + 1,
    score: i < slots.length ? slots[i] : 0
  }));
  if (flBonus) {
    let best: Scored | null = null;
    for (const o of out) if (o.fl != null && (!best || o.fl < (best.fl as number))) best = o;
    if (best && best.newPos <= 10) best.score += 1;
  }
  return out;
}

interface Ranked { name: string; pts: number; c: number[] }

function cmp(a: Ranked, b: Ranked): number {
  if (b.pts !== a.pts) return b.pts - a.pts;
  for (let i = 0; i < 24; i++) {
    const d = (b.c[i] || 0) - (a.c[i] || 0);
    if (d !== 0) return d;
  }
  return a.name.localeCompare(b.name);
}

export function compute(data: SeasonData, excluded: Set<string>): Computed {
  const flBonus = data.year >= 2019 && data.year <= 2024;
  const D = new Map<string, DriverStanding>();
  const T = new Map<string, TeamStanding>();
  const races: Computed['races'] = [];

  for (const race of data.races) {
    const main = scoreSession(race.rows, excluded, flBonus);
    const sprint = race.sprint ? scoreSession(race.sprint, excluded, false) : [];
    const orig = [...race.rows].sort((a, b) => a.pos - b.pos);
    races.push({
      round: race.round,
      name: race.name,
      date: race.date,
      origWinner: orig[0]?.name,
      newWinner: main[0]?.name,
      podium: main.slice(0, 3).map(x => x.code).join(', ')
    });
    const sessions: [Scored[], boolean][] = [[main, true], [sprint, false]];
    for (const [list, isRace] of sessions) {
      for (const o of list) {
        let d = D.get(o.id);
        if (!d) {
          d = { id: o.id, name: o.name, code: o.code, pts: 0, wins: 0, c: [], teams: new Map(), rank: 0 };
          D.set(o.id, d);
        }
        let t = T.get(o.tid);
        if (!t) {
          t = { id: o.tid, name: o.tname, pts: 0, wins: 0, c: [], rank: 0 };
          T.set(o.tid, t);
        }
        d.pts += o.score;
        t.pts += o.score;
        d.teams.set(o.tname, race.round);
        if (isRace) {
          d.c[o.newPos - 1] = (d.c[o.newPos - 1] || 0) + 1;
          t.c[o.newPos - 1] = (t.c[o.newPos - 1] || 0) + 1;
          if (o.newPos === 1) {
            d.wins++;
            t.wins++;
          }
        }
      }
    }
  }

  const drivers = [...D.values()].sort(cmp);
  const teams = [...T.values()].sort(cmp);
  drivers.forEach((d, i) => (d.rank = i + 1));
  teams.forEach((t, i) => (t.rank = i + 1));
  return { drivers, teams, races };
}

// Removed drivers keep the row they hold in the unmodified standings;
// the remaining drivers fill the other rows in their recalculated order.
export function slotOrder(base: DriverStanding[], active: DriverStanding[], excluded: Set<string>): Slot[] {
  const queue = [...active];
  return base.map(b =>
    excluded.has(b.id)
      ? { driver: b, out: true }
      : { driver: queue.shift() as DriverStanding, out: false }
  );
}

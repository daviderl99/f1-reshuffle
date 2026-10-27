import type { DriverStanding, Slot } from "../types";
import { fmt } from "../format";

interface Props {
  slots: Slot[];
  baseById: Map<string, DriverStanding>;
  onToggle: (id: string, include: boolean) => void;
}

export function RankDelta({ now, was }: { now: number; was: number }) {
  const d = was - now;
  if (d === 0) return null;
  return (
    <span className={"delta " + (d > 0 ? "up" : "down")}>
      {d > 0 ? "▲" : "▼"}
      {Math.abs(d)}
    </span>
  );
}

export function PtsDelta({ now, was }: { now: number; was: number }) {
  const d = now - was;
  if (d === 0) return null;
  return (
    <span className={"delta " + (d > 0 ? "up" : "down")}>
      {d > 0 ? "+" : "−"}
      {fmt(Math.abs(d))}
    </span>
  );
}

export default function DriversTable({ slots, baseById, onToggle }: Props) {
  let leaderPts: number | null = null;
  let prevPts = 0;

  const rows = slots.map(({ driver: d, out }) => {
    let gap: number | null = null;
    let toLeader: number | null = null;
    if (!out) {
      if (leaderPts === null) {
        leaderPts = d.pts;
      } else {
        gap = prevPts - d.pts;
        toLeader = leaderPts - d.pts;
      }
      prevPts = d.pts;
    }
    const b = baseById.get(d.id)!;
    const teams = [...d.teams.keys()].join(" / ");
    return (
      <tr key={d.id} className={out ? "out" : d.rank === 1 ? "lead" : ""}>
        <td>
          <input
            type="checkbox"
            checked={!out}
            onChange={(e) => onToggle(d.id, e.target.checked)}
            aria-label={`Include ${d.name} in the championship`}
          />
        </td>
        <td className="pos">{out ? "–" : d.rank}</td>
        <td>
          <span className="nm">{d.name}</span>
          <span className="code">{d.code}</span>
          <div className="team">{teams}</div>
        </td>
        <td className="n">{!out && <RankDelta now={d.rank} was={b.rank} />}</td>
        <td className="n pts">{out ? "–" : fmt(d.pts)}</td>
        <td
          className="n"
          title={
            toLeader !== null ? `${fmt(toLeader)} behind the leader` : undefined
          }
        >
          {out ? "" : gap === null ? "–" : "−" + fmt(gap)}
        </td>
        <td className="n">{!out && <PtsDelta now={d.pts} was={b.pts} />}</td>
        <td className="n">{out ? "–" : d.wins}</td>
      </tr>
    );
  });

  return (
    <table>
      <thead>
        <tr>
          <th>Incl.</th>
          <th>Pos</th>
          <th>Driver</th>
          <th className="n">vs actual</th>
          <th className="n">Pts</th>
          <th className="n" title="Points behind the driver directly ahead">
            Gap
          </th>
          <th className="n">Δ pts</th>
          <th className="n">Wins</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

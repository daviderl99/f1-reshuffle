import type { TeamStanding } from '../types';
import { fmt } from '../format';
import { PtsDelta, RankDelta } from './DriversTable';

interface Props {
  teams: TeamStanding[];
  baseById: Map<string, TeamStanding>;
}

export default function TeamsTable({ teams, baseById }: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>Pos</th>
          <th>Constructor</th>
          <th className="n">vs actual</th>
          <th className="n">Pts</th>
          <th className="n">Δ pts</th>
          <th className="n">Wins</th>
        </tr>
      </thead>
      <tbody>
        {teams.map(t => {
          const b = baseById.get(t.id)!;
          return (
            <tr key={t.id} className={t.rank === 1 ? 'lead' : ''}>
              <td className="pos">{t.rank}</td>
              <td>{t.name}</td>
              <td className="n"><RankDelta now={t.rank} was={b.rank} /></td>
              <td className="n pts">{fmt(t.pts)}</td>
              <td className="n"><PtsDelta now={t.pts} was={b.pts} /></td>
              <td className="n">{t.wins}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

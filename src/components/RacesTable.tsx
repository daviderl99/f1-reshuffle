import type { RaceSummary } from '../types';

export default function RacesTable({ races }: { races: RaceSummary[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Rd</th>
          <th>Grand Prix</th>
          <th>Actual winner</th>
          <th>Winner now</th>
          <th>Podium now</th>
        </tr>
      </thead>
      <tbody>
        {races.map(r => (
          <tr key={r.round} className={r.origWinner !== r.newWinner ? 'chg' : ''}>
            <td className="pos">{r.round}</td>
            <td>
              {r.name}
              <div className="team">{r.date}</div>
            </td>
            <td>{r.origWinner || '–'}</td>
            <td><b>{r.newWinner || '–'}</b></td>
            <td>{r.podium}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

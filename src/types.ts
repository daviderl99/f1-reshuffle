export interface Row {
  pos: number;
  id: string;
  name: string;
  code: string;
  tid: string;
  tname: string;
  pts: number;
  fl: number | null;
}

export interface Race {
  round: number;
  name: string;
  date: string;
  rows: Row[];
  sprint: Row[] | null;
}

export interface SeasonData {
  year: number;
  races: Race[];
}

export interface Scored extends Row {
  newPos: number;
  score: number;
}

export interface DriverStanding {
  id: string;
  name: string;
  code: string;
  pts: number;
  wins: number;
  c: number[];
  teams: Map<string, number>;
  rank: number;
}

export interface TeamStanding {
  id: string;
  name: string;
  pts: number;
  wins: number;
  c: number[];
  rank: number;
}

export interface RaceSummary {
  round: number;
  name: string;
  date: string;
  origWinner?: string;
  newWinner?: string;
  podium: string;
}

export interface Computed {
  drivers: DriverStanding[];
  teams: TeamStanding[];
  races: RaceSummary[];
}

export interface Slot {
  driver: DriverStanding;
  out: boolean;
}

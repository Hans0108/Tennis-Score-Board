export type SportType = 'tennis' | 'padel' | 'pickleball' | 'badminton' | 'table_tennis';

export interface Sponsor {
  name: string;
  logoUrl?: string; // Base64 PNG image Data URL
}

export interface Player {
  id: string;
  name: string;
  status: 'active' | 'resting' | 'away'; // active (available), resting (on deck/bench), away (unavailable/left early)
  matchesPlayed: number;
  wins: number;
  losses: number;
  restRounds: number; // Cumulative rounds rested/sat out
  consecutiveLosses: number; // To identify underperforming handicap trends
  netWins: number; // wins - losses
  courtPin?: 'any' | 'court_1' | 'court_2' | 'court_3' | 'court_4'; // Locked court number ('any' = free-shuffle)
}

export interface Court {
  id: string;
  name: string;
  status: 'idle' | 'playing';
}

export interface Match {
  id: string;
  courtId: string; // 'court_1' | 'court_2' | 'court_3' | 'court_4'
  teamA: string[]; // 1 or 2 Player IDs
  teamB: string[]; // 1 or 2 Player IDs
  scoreA: number;
  scoreB: number;
  finished: boolean;
  winner: 'A' | 'B' | null;
  timestamp: number;
}

export interface SessionConfig {
  clubName: string;
  clubLogoUrl?: string;
  activeCourts: 1 | 2 | 3 | 4; // Customizable active courts from 1 to 4
  court1Players: 2 | 4; // Customizable players playing on Court 1 (2 for Singles, 4 for Doubles)
  court2Players: 2 | 4; // Customizable players playing on Court 2 (2 for Singles, 4 for Doubles)
  court3Players: 2 | 4; // Customizable players playing on Court 3 (2 for Singles, 4 for Doubles)
  court4Players: 2 | 4; // Customizable players playing on Court 4 (2 for Singles, 4 for Doubles)
  totalDurationMinutes: number; // e.g. 120 or 240
  remainingSeconds: number;
  timerActive: boolean;
  activeSport: SportType;
  matchmakingMode: 'equal_rest' | 'handicap_balance';
  sponsors: Sponsor[];
}

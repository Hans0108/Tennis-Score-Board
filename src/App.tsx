import { useState, useEffect, useRef } from 'react';
import { Player, Match, SessionConfig, Sponsor, SportType } from './types';
import { SPORTS_LIST, SportInfo } from './sportsData';
import { 
  Users, 
  Trophy, 
  Activity, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Shuffle, 
  Award, 
  ListOrdered, 
  UserMinus, 
  Settings, 
  ChevronRight, 
  HelpCircle,
  Building,
  Image,
  Sparkles
} from 'lucide-react';

// pre-seeded roster of 12 sample players for full immediate rotation demo
const INITIAL_ROSTER: Player[] = [
  { id: 'p1', name: 'Joe Kent', status: 'resting', matchesPlayed: 4, wins: 3, losses: 1, restRounds: 2, consecutiveLosses: 0, netWins: 2 },
  { id: 'p2', name: 'Clarke Prince', status: 'resting', matchesPlayed: 5, wins: 4, losses: 1, restRounds: 1, consecutiveLosses: 0, netWins: 3 },
  { id: 'p3', name: 'Diana Prince', status: 'resting', matchesPlayed: 3, wins: 2, losses: 1, restRounds: 3, consecutiveLosses: 0, netWins: 1 },
  { id: 'p4', name: 'Bruce Wayne', status: 'resting', matchesPlayed: 4, wins: 2, losses: 2, restRounds: 2, consecutiveLosses: 1, netWins: 0 },
  { id: 'p5', name: 'Barry Allen', status: 'resting', matchesPlayed: 6, wins: 5, losses: 1, restRounds: 0, consecutiveLosses: 0, netWins: 4 },
  { id: 'p6', name: 'Arthur Curry', status: 'resting', matchesPlayed: 2, wins: 0, losses: 2, restRounds: 4, consecutiveLosses: 2, netWins: -2 },
  { id: 'p7', name: 'John Stewart', status: 'resting', matchesPlayed: 4, wins: 1, losses: 3, restRounds: 2, consecutiveLosses: 3, netWins: -2 },
  { id: 'p8', name: 'Oliver Queen', status: 'resting', matchesPlayed: 3, wins: 2, losses: 1, restRounds: 3, consecutiveLosses: 0, netWins: 1 },
  { id: 'p9', name: 'Barry Bonds', status: 'resting', matchesPlayed: 1, wins: 1, losses: 0, restRounds: 5, consecutiveLosses: 0, netWins: 1 },
  { id: 'p10', name: 'Victor Stone', status: 'resting', matchesPlayed: 0, wins: 0, losses: 0, restRounds: 6, consecutiveLosses: 0, netWins: 0 },
  { id: 'p11', name: 'Hal Jordan', status: 'resting', matchesPlayed: 2, wins: 1, losses: 1, restRounds: 4, consecutiveLosses: 1, netWins: 0 },
  { id: 'p12', name: 'Selina Kyle', status: 'resting', matchesPlayed: 3, wins: 1, losses: 2, restRounds: 3, consecutiveLosses: 2, netWins: -1 }
];

export default function App() {
  // Session Configuration & General States
  const [config, setConfig] = useState<SessionConfig>({
    clubName: 'Vantage Racket Club',
    activeCourts: 2,
    court1Players: 4,
    court2Players: 4,
    totalDurationMinutes: 180, // 3 hours
    remainingSeconds: 180 * 60,
    timerActive: false,
    activeSport: 'padel',
    matchmakingMode: 'equal_rest',
    sponsors: [
      { name: 'Apex Athletics' },
      { name: 'ProBounce' },
      { name: 'DropShot' }
    ]
  });

  const [players, setPlayers] = useState<Player[]>(INITIAL_ROSTER);
  const [activeMatches, setActiveMatches] = useState<Match[]>([]);
  const [completedMatches, setCompletedMatches] = useState<Match[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newSponsorName, setNewSponsorName] = useState('');
  const [newSponsorLogo, setNewSponsorLogo] = useState<string | undefined>(undefined);
  const [adminOpen, setAdminOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiMessage, setConfettiMessage] = useState('');
  const [fullscreenMatchId, setFullscreenMatchId] = useState<string | null>(null);

  const activeSportInfo = SPORTS_LIST.find((s) => s.id === config.activeSport) || SPORTS_LIST[0];

  // 1. Session Duration Countdown Timer Engine
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (config.timerActive && config.remainingSeconds > 0) {
      interval = setInterval(() => {
        setConfig(prev => ({
          ...prev,
          remainingSeconds: Math.max(0, prev.remainingSeconds - 1)
        }));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [config.timerActive, config.remainingSeconds]);

  // Sync state with local storage on startup and updates
  useEffect(() => {
    const saved = localStorage.getItem('casual_rotation_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.config) setConfig(parsed.config);
        if (parsed.players) setPlayers(parsed.players);
        if (parsed.completedMatches) setCompletedMatches(parsed.completedMatches);
        if (parsed.activeMatches) setActiveMatches(parsed.activeMatches);
      } catch (e) {
        console.error('Failed to parse cached session data', e);
      }
    }
  }, []);

  const saveToLocal = (nextPlayers = players, nextMatches = activeMatches, nextCompleted = completedMatches, nextConfig = config) => {
    localStorage.setItem(
      'casual_rotation_session',
      JSON.stringify({
        config: nextConfig,
        players: nextPlayers,
        activeMatches: nextMatches,
        completedMatches: nextCompleted
      })
    );
  };

  const updatePlayersAndSave = (next: Player[]) => {
    setPlayers(next);
    saveToLocal(next);
  };

  // Timer helpers
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const handleAdjustTimer = (minutes: number) => {
    setConfig(prev => {
      const nextSec = Math.max(0, prev.remainingSeconds + minutes * 60);
      const nextConf = { ...prev, remainingSeconds: nextSec };
      saveToLocal(players, activeMatches, completedMatches, nextConf);
      return nextConf;
    });
  };

  const handleResetSession = () => {
    setConfig(prev => {
      const nextConf = {
        ...prev,
        remainingSeconds: prev.totalDurationMinutes * 60,
        timerActive: false
      };
      saveToLocal(players, activeMatches, completedMatches, nextConf);
      return nextConf;
    });
    setCompletedMatches([]);
    setPlayers(players.map(p => ({
      ...p,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      restRounds: 0,
      consecutiveLosses: 0,
      netWins: 0,
      status: 'resting'
    })));
  };

  // 2. Roster Actions
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    
    const newPlayer: Player = {
      id: `player_${Date.now()}`,
      name: newPlayerName.trim(),
      status: 'resting',
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      restRounds: 0,
      consecutiveLosses: 0,
      netWins: 0
    };

    const next = [...players, newPlayer];
    updatePlayersAndSave(next);
    setNewPlayerName('');
  };

  const handleDeletePlayer = (id: string) => {
    // Check if player is currently in an active court game
    const isPlaying = activeMatches.some(m => m.teamA.includes(id) || m.teamB.includes(id));
    if (isPlaying) {
      alert("This player is currently active in a live court match. Finish or clear their match first!");
      return;
    }

    const next = players.filter((p) => p.id !== id);
    updatePlayersAndSave(next);
  };

  const handleTogglePlayerAway = (id: string) => {
    const isPlaying = activeMatches.some(m => m.teamA.includes(id) || m.teamB.includes(id));
    if (isPlaying) {
      alert("This player is currently in a live match!");
      return;
    }

    const next = players.map(p => {
      if (p.id !== id) return p;
      const nextStatus: Player['status'] = p.status === 'away' ? 'resting' : 'away';
      return { ...p, status: nextStatus };
    });
    updatePlayersAndSave(next);
  };

  // Get active playing ids
  const getPlayingPlayerIds = () => {
    return activeMatches.flatMap(m => [...m.teamA, ...m.teamB]);
  };

  // 3. Smart Rotation Matchmaking Algorithm
  const handleAutoAssign = () => {
    const playingIds = getPlayingPlayerIds();
    
    // Get list of players who are available to rotate on court (i.e. status is 'resting' and not away and not currently playing)
    const availablePlayers = players.filter(
      p => p.status === 'resting' && !playingIds.includes(p.id)
    );

    // How many spots are we filling?
    // We can auto-fill open courts. Let's see which courts are idle:
    const occupiedCourtIds = activeMatches.map(m => m.courtId);
    const idleCourtIds: string[] = [];
    if (!occupiedCourtIds.includes('court_1')) idleCourtIds.push('court_1');
    if (config.activeCourts === 2 && !occupiedCourtIds.includes('court_2')) {
      idleCourtIds.push('court_2');
    }

    if (idleCourtIds.length === 0) {
      alert("All active courts are currently occupied! Wait for a match to finish.");
      return;
    }

    // Calculate sum of required players based on customizable capacity per idle court
    let neededPlayers = 0;
    idleCourtIds.forEach(courtId => {
      const format = courtId === 'court_1' ? config.court1Players : config.court2Players;
      neededPlayers += format;
    });

    if (availablePlayers.length < neededPlayers) {
      alert(
        `Not enough available players to populate idle court(s)! You need at least ${neededPlayers} benched/resting players. Currently available: ${availablePlayers.length}.\n\nPlease add more players, or change courts to Singles format.`
      );
      return;
    }

    // Sort available players to find who has benched/rested the most!
    // Adding minor random sorting jitter to break ties dynamically & generate fresh pairings
    const sortedForPlay = [...availablePlayers].sort((a, b) => {
      if (b.restRounds !== a.restRounds) {
        return b.restRounds - a.restRounds; // Highest benched rounds first
      }
      return Math.random() - 0.5; // Random tie-break
    });

    // Select the lucky players to enter court play
    const selectedPlayers = sortedForPlay.slice(0, neededPlayers);
    const newMatches: Match[] = [...activeMatches];

    // For each idle court, allocate a beautiful balanced or random match (Singles 1v1 or Doubles 2v2)
    let selectedIndex = 0;
    idleCourtIds.forEach((courtId) => {
      const format = courtId === 'court_1' ? config.court1Players : config.court2Players;
      const courtPlayers = selectedPlayers.slice(selectedIndex, selectedIndex + format);
      selectedIndex += format;

      let teamA: string[] = [];
      let teamB: string[] = [];

      if (format === 2) {
        // Singles match (1v1)
        // Shuffled random assignment for 1v1 Singles
        const shuffled = [...courtPlayers].sort(() => Math.random() - 0.5);
        teamA = [shuffled[0].id];
        teamB = [shuffled[1].id];
      } else {
        // Doubles match (2v2)
        if (config.matchmakingMode === 'equal_rest') {
          // Mode A: Shuffled Pairing from the equal-play roster list
          const shuffled = [...courtPlayers].sort(() => Math.random() - 0.5);
          teamA = [shuffled[0].id, shuffled[1].id];
          teamB = [shuffled[2].id, shuffled[3].id];
        } else {
          // Mode B: Fair Handicap Balance (Pro + Beginner Pairing)
          // Sort court's 4 players by net wins / win rate to identify strengths
          const sortedBySkill = [...courtPlayers].sort((a, b) => {
            // Compare net wins, then win rate
            const netDiff = b.netWins - a.netWins;
            if (netDiff !== 0) return netDiff;
            const wrA = a.matchesPlayed > 0 ? a.wins / a.matchesPlayed : 0.5;
            const wrB = b.matchesPlayed > 0 ? b.wins / b.matchesPlayed : 0.5;
            return wrB - wrA;
          });

          // Team A: Best Player (1st) + Developing Player (4th)
          teamA = [sortedBySkill[0].id, sortedBySkill[3].id];
          // Team B: Second Best (2nd) + Third Best (3rd)
          teamB = [sortedBySkill[1].id, sortedBySkill[2].id];
        }
      }

      newMatches.push({
        id: `match_${courtId}_${Date.now()}`,
        courtId,
        teamA,
        teamB,
        scoreA: 0,
        scoreB: 0,
        finished: false,
        winner: null,
        timestamp: Date.now()
      });
    });

    // Mark selected players as active on courts
    const selectedIds = selectedPlayers.map(p => p.id);
    const nextPlayers = players.map(p => {
      if (selectedIds.includes(p.id)) {
        return { ...p, status: 'active' as const };
      }
      return p;
    });

    setPlayers(nextPlayers);
    setActiveMatches(newMatches);
    saveToLocal(nextPlayers, newMatches, completedMatches, config);
  };

  // Complete Match Winner Declaration logic
  const handleDeclareWinner = (matchId: string, winningTeam: 'A' | 'B') => {
    const match = activeMatches.find(m => m.id === matchId);
    if (!match) return;

    const winnerIds = winningTeam === 'A' ? match.teamA : match.teamB;
    const loserIds = winningTeam === 'A' ? match.teamB : match.teamA;

    // Build completed match object
    const finalMatch: Match = {
      ...match,
      finished: true,
      winner: winningTeam,
      timestamp: Date.now()
    };

    // Filter out of active courts
    const nextMatches = activeMatches.filter(m => m.id !== matchId);
    const nextCompleted = [finalMatch, ...completedMatches];

    // Determine current active playing ids across other courts to avoid over-bench-scoring
    const otherPlayingIds = nextMatches.flatMap(m => [...m.teamA, ...m.teamB]);

    // Update player win/loss records, losing streaks, and increment rest-rounds for benched players
    const nextPlayers = players.map(p => {
      const isWinner = winnerIds.includes(p.id);
      const isLoser = loserIds.includes(p.id);

      if (isWinner) {
        return {
          ...p,
          status: 'resting' as const,
          matchesPlayed: p.matchesPlayed + 1,
          wins: p.wins + 1,
          consecutiveLosses: 0,
          netWins: p.wins + 1 - p.losses
        };
      }
      if (isLoser) {
        const nextLosses = p.losses + 1;
        return {
          ...p,
          status: 'resting' as const,
          matchesPlayed: p.matchesPlayed + 1,
          losses: nextLosses,
          consecutiveLosses: p.consecutiveLosses + 1,
          netWins: p.wins - nextLosses
        };
      }

      // If they are sitting out (bench queue), increase their restRounds!
      // This ensures correct rotation priority for players sitting out while this match was resolved.
      if (p.status === 'resting' && !otherPlayingIds.includes(p.id)) {
        return {
          ...p,
          restRounds: p.restRounds + 1
        };
      }

      return p;
    });

    setPlayers(nextPlayers);
    setActiveMatches(nextMatches);
    setCompletedMatches(nextCompleted);
    saveToLocal(nextPlayers, nextMatches, nextCompleted, config);

    // Trigger celebration banner
    const winnerNames = winnerIds.map(id => players.find(p => p.id === id)?.name || 'Unknown').join(' & ');
    setConfettiMessage(`🏆 ${winnerNames} Won the Match!`);
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 4500);
  };

  const handleUpdateScore = (matchId: string, team: 'A' | 'B', delta: number) => {
    const nextMatches = activeMatches.map(m => {
      if (m.id !== matchId) return m;
      const updated = { ...m };
      if (team === 'A') {
        updated.scoreA = Math.max(0, updated.scoreA + delta);
      } else {
        updated.scoreB = Math.max(0, updated.scoreB + delta);
      }
      return updated;
    });
    setActiveMatches(nextMatches);
    saveToLocal(players, nextMatches, completedMatches, config);
  };

  // Revert / Clear active court match without logging statistics
  const handleClearCourtMatch = (matchId: string) => {
    const match = activeMatches.find(m => m.id === matchId);
    if (!match) return;

    const courtPlayerIds = [...match.teamA, ...match.teamB];
    const nextMatches = activeMatches.filter(m => m.id !== matchId);

    // Restore court players to resting queue
    const nextPlayers = players.map(p => {
      if (courtPlayerIds.includes(p.id)) {
        return { ...p, status: 'resting' as const };
      }
      return p;
    });

    setPlayers(nextPlayers);
    setActiveMatches(nextMatches);
    saveToLocal(nextPlayers, nextMatches, completedMatches, config);
  };

  // Admin Actions
  const handleClubLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        alert('Please select a PNG image file only!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const nextConf = { ...config, clubLogoUrl: reader.result as string };
        setConfig(nextConf);
        saveToLocal(players, activeMatches, completedMatches, nextConf);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsorName.trim()) return;
    
    const newSponsor: Sponsor = {
      name: newSponsorName.trim(),
      logoUrl: newSponsorLogo
    };

    const nextConf = { ...config, sponsors: [...config.sponsors, newSponsor] };
    setConfig(nextConf);
    saveToLocal(players, activeMatches, completedMatches, nextConf);
    setNewSponsorName('');
    setNewSponsorLogo(undefined);
  };

  const handleSponsorLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        alert('Please select a PNG image file only!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewSponsorLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSponsor = (idx: number) => {
    const nextSponsors = [...config.sponsors];
    nextSponsors.splice(idx, 1);
    const nextConf = { ...config, sponsors: nextSponsors };
    setConfig(nextConf);
    saveToLocal(players, activeMatches, completedMatches, nextConf);
  };

  // Helper to fetch player name safely
  const getPlayerName = (id: string) => {
    return players.find(p => p.id === id)?.name || 'Unknown';
  };

  // Active sport line color mappings
  const primaryColor = activeSportInfo.primaryColor;

  // On Deck Queue Order calculation
  // Players who are 'resting' and NOT currently playing on active courts, sorted by rested priority
  const playingIds = getPlayingPlayerIds();
  const onDeckQueue = players
    .filter(p => p.status === 'resting' && !playingIds.includes(p.id))
    .sort((a, b) => b.restRounds - a.restRounds);

  return (
    <div className="min-h-screen bg-[#02050e] text-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* 1. TOP BRANDING BANNER HEADER */}
      <header className="sticky top-0 z-40 bg-[#02050e]/95 backdrop-blur-md border-b border-slate-900/80 px-4 md:px-8 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand & Club Logo */}
          <div className="flex items-center gap-3">
            {config.clubLogoUrl ? (
              <img 
                src={config.clubLogoUrl} 
                alt="Club Logo" 
                className="h-9 w-auto object-contain rounded-lg border border-slate-800 bg-slate-900 p-0.5" 
              />
            ) : (
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs border"
                style={{ borderColor: primaryColor, color: primaryColor, boxShadow: `0 0 10px ${primaryColor}30` }}
              >
                {activeSportInfo.emoji}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight font-display text-white">CourtCraft</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                  Club Rotation
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{config.clubName}</p>
            </div>
          </div>

          {/* Quick Stats Banner or Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Session Rules Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setAdminOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 cursor-pointer transition-all"
            >
              <Settings className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span>Session Setup</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. SPONSORS BOARD MARQUEE BANNER */}
      {config.sponsors.length > 0 && (
        <div className="bg-[#030818] border-b border-slate-900 py-2.5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-[11px] h-6">
            <span className="text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap mr-6 flex items-center h-full">
              ⭐ Racket Sponsors:
            </span>
            <div className="flex-1 overflow-hidden relative w-full h-6 flex items-center">
              <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-slate-400">
                {config.sponsors.concat(config.sponsors).map((s, idx) => (
                  <span key={idx} className="font-semibold flex items-center gap-2 tracking-wide shrink-0">
                    {s.logoUrl ? (
                      <img src={s.logoUrl} alt={s.name} className="h-5 w-auto object-contain rounded bg-white/5 p-0.5" />
                    ) : (
                      <span>⚡ {s.name}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SESSION NOTIFICATION BAR FOR WINS */}
      {confettiActive && (
        <div className="bg-emerald-950/80 border-b border-emerald-900/50 py-3 px-4 text-center text-xs font-bold text-emerald-300 animate-pulse flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{confettiMessage}</span>
        </div>
      )}

      {/* 4. MAIN LAYOUT GRID */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* LEFT PANEL: ROSTER AND ON-DECK QUEUE (4 Cols) */}
        <section className="lg:col-span-4 space-y-6">
          
          {/* A. Session Stats Overview & Timer */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-5 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-full pointer-events-none" style={{ backgroundColor: primaryColor }} />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                <span>Session Time Left</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800/80">
                <button
                  onClick={() => handleAdjustTimer(-15)}
                  className="px-1.5 py-0.5 text-[9px] font-bold text-slate-400 hover:text-white"
                  title="Deduct 15 mins"
                >
                  -15m
                </button>
                <button
                  onClick={() => handleAdjustTimer(15)}
                  className="px-1.5 py-0.5 text-[9px] font-bold text-slate-400 hover:text-white border-l border-slate-800/80"
                  title="Add 15 mins"
                >
                  +15m
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                {formatTime(config.remainingSeconds)}
              </span>
              <button
                onClick={() => setConfig(prev => ({ ...prev, timerActive: !prev.timerActive }))}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-all ${
                  config.timerActive 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-[#02050e] shadow-md'
                }`}
                style={!config.timerActive ? { backgroundColor: primaryColor } : undefined}
              >
                {config.timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
              </button>
            </div>

            {/* Circular visual progress meter */}
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full transition-all duration-1000" 
                style={{ 
                  backgroundColor: primaryColor,
                  width: `${(config.remainingSeconds / (config.totalDurationMinutes * 60)) * 100}%` 
                }} 
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
              <span>Remaining duration</span>
              <button 
                onClick={handleResetSession} 
                className="text-rose-400 hover:underline font-bold tracking-widest cursor-pointer"
              >
                Clear History & Reset
              </button>
            </div>
          </div>

          {/* B. Active Player Entry & Roster Leaderboard */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-5 backdrop-blur-md">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: primaryColor }} />
              <span>Player Roster ({players.length})</span>
            </h2>

            {/* Roster Guide Key */}
            <div className="grid grid-cols-3 text-[10px] text-slate-500 font-bold mb-3 p-2 rounded-lg bg-slate-900/30 border border-slate-900 text-center">
              <span>🟢 Available</span>
              <span>🟠 On Court</span>
              <span>⚫ Away</span>
            </div>

            {/* Add Player Form */}
            <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add player name..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl text-slate-950 font-bold flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            {/* Scrollable Leaderboard */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {players.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No players added yet. Use the input box above to load roster.
                </div>
              ) : (
                [...players]
                  .sort((a, b) => {
                    // Sorting by net wins primarily (highest net win on top)
                    if (b.netWins !== a.netWins) return b.netWins - a.netWins;
                    return b.wins - a.wins; // tie breaker on raw wins
                  })
                  .map((p) => {
                    const isPlaying = playingIds.includes(p.id);
                    const isAway = p.status === 'away';
                    
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isPlaying
                            ? 'bg-slate-900/40 border-slate-800'
                            : isAway
                            ? 'bg-slate-950/20 border-slate-950 opacity-40'
                            : 'bg-slate-950/20 border-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Colored status node indicator */}
                          <button
                            type="button"
                            onClick={() => handleTogglePlayerAway(p.id)}
                            className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                              isPlaying
                                ? 'bg-amber-500 border-amber-500 animate-pulse'
                                : isAway
                                ? 'bg-slate-700 border-slate-700'
                                : 'bg-emerald-500 border-emerald-500'
                            }`}
                            title={isAway ? "Click to set Available" : "Click to set Away / Left early"}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-200">{p.name}</span>
                              {p.consecutiveLosses >= 2 && (
                                <span className="text-[8px] bg-red-950 text-red-400 font-extrabold px-1 rounded uppercase tracking-wider">
                                  -{p.consecutiveLosses} Streak
                                </span>
                              )}
                              {p.netWins >= 2 && (
                                <span className="text-[8px] bg-emerald-950 text-emerald-400 font-extrabold px-1 rounded uppercase tracking-wider">
                                  🔥 Pro
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold uppercase font-mono block mt-0.5">
                              P: {p.matchesPlayed} | W: {p.wins} | L: {p.losses} | Sat: {p.restRounds}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black font-mono" style={{ color: p.netWins >= 0 ? '#10b981' : '#f43f5e' }}>
                            {p.netWins >= 0 ? `+${p.netWins}` : p.netWins}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeletePlayer(p.id)}
                            className="p-1 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                            title="Delete Player"
                          >
                            <Trash2 className="w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
            <p className="text-[9px] text-slate-500 italic text-center mt-3">Click the colored status dot to set players as "Away" to exclude them from rotation.</p>
          </div>

        </section>

        {/* MIDDLE & RIGHT PANEL: ACTIVE COURTS, QUEUES & HISTORY (8 Cols) */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* A. Session & Rotation Control Hub */}
          <div className="p-5 rounded-2xl border border-slate-800/80 bg-slate-950/40 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Matchmaking Controls</h2>
              <p className="text-[11px] text-slate-500">
                Mode: {config.matchmakingMode === 'equal_rest' ? 'Equal resting rotation (Equalizes rounds)' : 'Skill handicap (Pro + Beginner balanced teams)'}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Roster Size warnings */}
              {onDeckQueue.length > 0 && (
                <div className="text-[10px] font-bold text-amber-400 bg-amber-950/20 px-2.5 py-1 rounded-lg border border-amber-900/40">
                  Bench queue size: {onDeckQueue.length}
                </div>
              )}

              {/* Matchmaking Mode Selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-850">
                <button
                  onClick={() => setConfig(prev => {
                    const next = { ...prev, matchmakingMode: 'equal_rest' as const };
                    saveToLocal(players, activeMatches, completedMatches, next);
                    return next;
                  })}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                    config.matchmakingMode === 'equal_rest' ? 'bg-slate-950 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mode A: Equal rest
                </button>
                <button
                  onClick={() => setConfig(prev => {
                    const next = { ...prev, matchmakingMode: 'handicap_balance' as const };
                    saveToLocal(players, activeMatches, completedMatches, next);
                    return next;
                  })}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                    config.matchmakingMode === 'handicap_balance' ? 'bg-slate-950 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mode B: Skill handicap
                </button>
              </div>

              {/* Generate Match button */}
              <button
                onClick={handleAutoAssign}
                className="py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-[#02050e] flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <Shuffle className="w-3.5 h-3.5 fill-slate-950" />
                <span>Next Round Match 🚀</span>
              </button>
            </div>
          </div>

          {/* B. SIDE-BY-SIDE ACTIVE COURTS HUD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: config.activeCourts }).map((_, idx) => {
              const courtId = `court_${idx + 1}`;
              const activeMatch = activeMatches.find(m => m.courtId === courtId);
              const isOccupied = !!activeMatch;

              return (
                <div 
                  key={courtId}
                  className="rounded-3xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-md overflow-hidden relative min-h-[380px] flex flex-col justify-between shadow-lg"
                  style={isOccupied ? { boxShadow: `0 0 25px -5px ${primaryColor}15` } : undefined}
                >
                  {/* Court title header */}
                  <div className="px-5 py-3.5 border-b border-slate-900 bg-slate-950/80 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-xs font-black text-white tracking-wide block">COURT {idx + 1}</span>
                        <span className="text-[9px] font-mono font-semibold text-slate-500 uppercase">
                          {isOccupied ? 'Rally Live' : 'COURT IDLE'}
                        </span>
                      </div>
                      
                      {/* Court specific capacity customizable layout selector */}
                      <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-850">
                        <button
                          type="button"
                          onClick={() => {
                            const nextConf = { 
                              ...config, 
                              [courtId === 'court_1' ? 'court1Players' : 'court2Players']: 2 as const 
                            };
                            setConfig(nextConf);
                            saveToLocal(players, activeMatches, completedMatches, nextConf);
                          }}
                          disabled={isOccupied}
                          className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded transition-colors cursor-pointer ${
                            (courtId === 'court_1' ? config.court1Players : config.court2Players) === 2
                              ? 'bg-slate-950 text-white font-black shadow'
                              : 'text-slate-500 hover:text-slate-300 disabled:opacity-40'
                          }`}
                          title="Set to 1v1 Singles on this court"
                        >
                          👤 Singles (2p)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextConf = { 
                              ...config, 
                              [courtId === 'court_1' ? 'court1Players' : 'court2Players']: 4 as const 
                            };
                            setConfig(nextConf);
                            saveToLocal(players, activeMatches, completedMatches, nextConf);
                          }}
                          disabled={isOccupied}
                          className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded transition-colors cursor-pointer ${
                            (courtId === 'court_1' ? config.court1Players : config.court2Players) === 4
                              ? 'bg-slate-950 text-white font-black shadow'
                              : 'text-slate-500 hover:text-slate-300 disabled:opacity-40'
                          }`}
                          title="Set to 2v2 Doubles on this court"
                        >
                          👥 Doubles (4p)
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                        {isOccupied ? 'Occupied' : 'Open'}
                      </span>
                    </div>
                  </div>

                  {/* Court Content body */}
                  <div className="flex-1 relative flex items-center justify-center p-3.5 min-h-[220px]">
                    {isOccupied ? (
                      <div className="relative w-full h-full overflow-hidden rounded-2xl flex flex-col justify-between p-4 bg-[#0a0f1d] border border-slate-900">
                        
                        {/* Interactive tactile SVG schematic background */}
                        <div className="absolute inset-0 z-0 opacity-25 flex items-center justify-center pointer-events-none p-2">
                          <svg viewBox="0 0 400 240" className="w-full h-full" fill="none">
                            <rect x="5" y="5" width="390" height="230" stroke={primaryColor} strokeWidth="1.5" strokeDasharray="3,3" />
                            <line x1="200" y1="5" x2="200" y2="235" stroke="#f1f5f9" strokeWidth="2.5" />
                            {config.activeSport === 'tennis' && (
                              <>
                                <line x1="5" y1="25" x2="395" y2="25" stroke={primaryColor} strokeWidth="1" />
                                <line x1="5" y1="215" x2="395" y2="215" stroke={primaryColor} strokeWidth="1" />
                              </>
                            )}
                            {config.activeSport === 'pickleball' && (
                              <rect x="150" y="5" width="100" height="230" fill={primaryColor} fillOpacity="0.15" />
                            )}
                          </svg>
                        </div>

                        {/* Interactive overlay click buttons */}
                        <div className="absolute inset-0 z-10 grid grid-cols-2">
                          <button
                            onClick={() => handleUpdateScore(activeMatch.id, 'A', 1)}
                            className="w-full h-full text-left relative focus:outline-none active:bg-white/5 transition-colors overflow-hidden group/left cursor-pointer"
                            title="Add point to Team A"
                          >
                            <span className="absolute top-2 left-2 text-[9px] font-bold text-white/30 group-hover/left:text-white/60 uppercase tracking-widest">
                              👈 Score Team A
                            </span>
                          </button>
                          <button
                            onClick={() => handleUpdateScore(activeMatch.id, 'B', 1)}
                            className="w-full h-full text-right relative focus:outline-none active:bg-white/5 transition-colors overflow-hidden group/right cursor-pointer"
                            title="Add point to Team B"
                          >
                            <span className="absolute top-2 right-2 text-[9px] font-bold text-white/30 group-hover/right:text-white/60 uppercase tracking-widest">
                              Score Team B 👉
                            </span>
                          </button>
                        </div>

                        {/* Floating visual HUD player tags & score numerals */}
                        <div className="relative z-20 h-full flex flex-col justify-between pointer-events-none">
                          
                           {/* Top: Team Name / Initials */}
                          <div className="flex items-start justify-between text-xs font-bold text-slate-300">
                            <div className="flex flex-col gap-1 text-left">
                              <span className="text-[9px] uppercase font-mono text-slate-500 font-extrabold tracking-widest">Team A</span>
                              <div className="space-y-0.5">
                                {activeMatch.teamA.map(id => (
                                  <p key={id} className="text-slate-100 font-extrabold text-[11px] tracking-tight leading-none">
                                    {getPlayerName(id)}
                                  </p>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1 text-right">
                              <span className="text-[9px] uppercase font-mono text-slate-500 font-extrabold tracking-widest">Team B</span>
                              <div className="space-y-0.5">
                                {activeMatch.teamB.map(id => (
                                  <p key={id} className="text-slate-100 font-extrabold text-[11px] tracking-tight leading-none">
                                    {getPlayerName(id)}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Middle: Giant glowing score values (Perfectly centered & spaced) */}
                          <div className="flex items-center justify-center gap-8 sm:gap-12 my-auto">
                            <span 
                              className="text-5xl sm:text-6xl font-black font-display tracking-tighter text-white drop-shadow text-right min-w-[3.5rem]"
                              style={{ textShadow: `0 0 20px ${primaryColor}60` }}
                            >
                              {activeMatch.scoreA}
                            </span>
                            <span className="text-slate-600 font-bold text-[10px] uppercase font-mono tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-850">vs</span>
                            <span 
                              className="text-5xl sm:text-6xl font-black font-display tracking-tighter text-white drop-shadow text-left min-w-[3.5rem]"
                              style={{ textShadow: `0 0 20px ${primaryColor}60` }}
                            >
                              {activeMatch.scoreB}
                            </span>
                          </div>

                          {/* Bottom Score helper */}
                          <p className="text-[9px] text-center font-semibold text-slate-500 uppercase tracking-wider">
                            Click left or right half of the card to score +1 point
                          </p>
                        </div>

                      </div>
                    ) : (
                      <div className="text-center py-10 space-y-3 px-6">
                        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-lg mx-auto text-slate-500 animate-pulse">
                          ⏱️
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-300 uppercase">Court is open</p>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Generate new match pairings using the control deck above to occupy this court.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Court Card actions footer */}
                  <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-900 flex items-center justify-between gap-2.5">
                    {isOccupied ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateScore(activeMatch.id, 'A', -1)}
                            disabled={activeMatch.scoreA === 0}
                            className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 rounded border border-slate-800 disabled:opacity-30 cursor-pointer"
                            title="Subtract A point"
                          >
                            -A
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateScore(activeMatch.id, 'B', -1)}
                            disabled={activeMatch.scoreB === 0}
                            className="px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900 rounded border border-slate-800 disabled:opacity-30 cursor-pointer"
                            title="Subtract B point"
                          >
                            -B
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClearCourtMatch(activeMatch.id)}
                            className="px-2 py-1 text-[10px] font-semibold text-rose-400 hover:text-rose-300 bg-slate-900/20 rounded border border-rose-950/40 cursor-pointer"
                            title="Cancel play, bench players"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => setFullscreenMatchId(activeMatch.id)}
                            className="px-2 py-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-slate-900 rounded border border-slate-800 cursor-pointer flex items-center gap-1"
                            title="Open Immersive Fullscreen Scoreboard"
                          >
                            📺 Zoom
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeclareWinner(activeMatch.id, 'A')}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-950 hover:bg-slate-200 cursor-pointer flex items-center gap-1"
                            style={{ backgroundColor: primaryColor }}
                          >
                            🏆 A Won
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclareWinner(activeMatch.id, 'B')}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-950 hover:bg-slate-200 cursor-pointer flex items-center gap-1"
                            style={{ backgroundColor: primaryColor }}
                          >
                            🏆 B Won
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={handleAutoAssign}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase text-slate-300 tracking-wider border border-slate-850 cursor-pointer text-center"
                      >
                        Auto-Allocate Court {idx + 1}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* C. NEXT UP / ON DECK BENCH QUEUE & HISTORY PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. On Deck Queue Panel */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-5 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <ListOrdered className="w-4 h-4" style={{ color: primaryColor }} />
                <span>On Deck / Rest Queue ({onDeckQueue.length})</span>
              </h3>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {onDeckQueue.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-600">
                    No players benched or resting. All players are active on court or away!
                  </div>
                ) : (
                  onDeckQueue.map((p, index) => {
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/30 border border-slate-900"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black text-slate-500 w-4">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-200">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-semibold text-slate-500 uppercase">
                            Rested: {p.restRounds} Rounds
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-[8px] text-slate-500 italic mt-3">The queue is calculated in real-time, prioritizing the players who have sat out the longest to guarantee perfectly equal playtime rotation.</p>
            </div>

            {/* 2. Session Match Log History */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-5 backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Completed Matches ({completedMatches.length})</span>
              </h3>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {completedMatches.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-600">
                    No games completed yet this session. Finish court matches to log results!
                  </div>
                ) : (
                  completedMatches.map((m) => {
                    const isWinnerA = m.winner === 'A';
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-xl bg-slate-900/20 border border-slate-900 flex flex-col gap-1 text-[10px]"
                      >
                        <div className="flex items-center justify-between font-mono text-[9px] text-slate-500">
                          <span>{m.courtId === 'court_1' ? 'Court 1' : 'Court 2'} Match</span>
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-0.5">
                          <div className={`p-1 rounded ${isWinnerA ? 'bg-emerald-950/30 text-emerald-300 font-bold' : 'text-slate-400'}`}>
                            {m.teamA.map(getPlayerName).join(' & ')} {isWinnerA && '🏆'}
                          </div>
                          <div className={`p-1 rounded text-right ${!isWinnerA ? 'bg-emerald-950/30 text-emerald-300 font-bold' : 'text-slate-400'}`}>
                            {!isWinnerA && '🏆'} {m.teamB.map(getPlayerName).join(' & ')}
                          </div>
                        </div>

                        <div className="text-center text-slate-500 font-mono font-bold mt-1">
                          Score: {m.scoreA} - {m.scoreB}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </section>

      </main>

      {/* 5. FLOATING ADMIN SLIDE OUT CONFIGURATION PANEL */}
      {adminOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setAdminOpen(false)} />

          {/* Panel */}
          <div className="relative w-full max-w-md h-full bg-[#030612] border-l border-slate-900 p-6 flex flex-col justify-between shadow-2xl z-10 animate-slide-in overflow-y-auto">
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" style={{ color: primaryColor }} />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">Session Configurations</h2>
                </div>
                <button
                  onClick={() => setAdminOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Racket Sport Theme Switcher */}
              <div className="space-y-3">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Racket Sport Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {SPORTS_LIST.map((sport) => {
                    const isActive = config.activeSport === sport.id;
                    return (
                      <button
                        key={sport.id}
                        type="button"
                        onClick={() => {
                          const nextConf = { ...config, activeSport: sport.id };
                          setConfig(nextConf);
                          saveToLocal(players, activeMatches, completedMatches, nextConf);
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-900/80 text-white font-bold'
                            : 'bg-slate-950/20 border-slate-900/60 text-slate-400 hover:text-slate-200'
                        }`}
                        style={isActive ? { borderColor: sport.primaryColor } : { borderColor: 'transparent' }}
                      >
                        <span className="text-sm">{sport.emoji}</span>
                        <span className="text-xs truncate">{sport.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Court Allocator Settings */}
              <div className="space-y-3">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Active Courts rented</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      const nextConf = { ...config, activeCourts: 1 as const };
                      setConfig(nextConf);
                      saveToLocal(players, activeMatches, completedMatches, nextConf);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      config.activeCourts === 1 ? 'bg-slate-950 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1 Court (4 players active)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextConf = { ...config, activeCourts: 2 as const };
                      setConfig(nextConf);
                      saveToLocal(players, activeMatches, completedMatches, nextConf);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      config.activeCourts === 2 ? 'bg-slate-950 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2 Courts (8 players active)
                  </button>
                </div>
              </div>

              {/* Session Duration Selector */}
              <div className="space-y-3">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Session Duration</label>
                <select
                  value={config.totalDurationMinutes}
                  onChange={(e) => {
                    const mins = parseInt(e.target.value) || 120;
                    const nextConf = {
                      ...config,
                      totalDurationMinutes: mins,
                      remainingSeconds: mins * 60
                    };
                    setConfig(nextConf);
                    saveToLocal(players, activeMatches, completedMatches, nextConf);
                  }}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value={120}>2 Hours (120 min)</option>
                  <option value={180}>3 Hours (180 min)</option>
                  <option value={240}>4 Hours (240 min)</option>
                </select>
              </div>

              {/* PNG Club Logo Uploader */}
              <div className="space-y-3">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Club Logo (PNG, Optional)</label>
                <input
                  type="file"
                  accept="image/png"
                  onChange={handleClubLogoUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-900 file:text-white file:hover:bg-slate-800 cursor-pointer"
                />
                {config.clubLogoUrl && (
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 p-2 rounded-xl">
                    <span className="text-[9px] text-slate-500">Logo preview:</span>
                    <img src={config.clubLogoUrl} alt="Club Logo" className="h-6 w-auto object-contain rounded bg-slate-900 p-0.5 border border-slate-800" />
                    <button
                      type="button"
                      onClick={() => {
                        const nextConf = { ...config, clubLogoUrl: undefined };
                        setConfig(nextConf);
                        saveToLocal(players, activeMatches, completedMatches, nextConf);
                      }}
                      className="text-[9px] text-rose-400 font-bold hover:underline ml-auto cursor-pointer"
                    >
                      Clear Logo
                    </button>
                  </div>
                )}
              </div>

              {/* sponsors Board Builder */}
              <div className="space-y-4 pt-4 border-t border-slate-900">
                <label className="text-[10px] text-slate-500 font-bold uppercase block">Manage Session Sponsors</label>
                <form onSubmit={handleAddSponsor} className="space-y-2.5 bg-slate-950 border border-slate-900 p-3 rounded-xl">
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Brand Name</span>
                    <input
                      type="text"
                      placeholder="Add sponsor name..."
                      value={newSponsorName}
                      onChange={(e) => setNewSponsorName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">PNG Brand Logo (Optional)</span>
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleSponsorLogoUpload}
                      className="w-full text-[10px] text-slate-400 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-900 file:text-white cursor-pointer"
                    />
                  </div>
                  {newSponsorLogo && (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500">Logo preview:</span>
                      <img src={newSponsorLogo} alt="Sponsor preview" className="h-5 w-auto object-contain bg-white/5 p-0.5 rounded" />
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    + Add Sponsor
                  </button>
                </form>

                <div className="flex flex-wrap gap-2">
                  {config.sponsors.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 text-xs border border-slate-800 text-slate-300">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt={s.name} className="h-4 w-auto object-contain rounded bg-white/5 p-0.5" />
                      ) : (
                        <span>⚡ {s.name}</span>
                      )}
                      <button
                        onClick={() => handleRemoveSponsor(idx)}
                        className="text-rose-400 font-extrabold hover:text-rose-500 text-xs ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Save Close Button */}
            <button
              onClick={() => setAdminOpen(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold border border-slate-800 cursor-pointer transition-colors mt-6"
            >
              Close Configurator
            </button>

          </div>
        </div>
      )}

      {/* 6. HELP RULE DIALOGUE MODAL */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setHelpOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#070b13] border border-slate-900 rounded-2xl p-6 shadow-2xl z-10 space-y-4 overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <span className="font-extrabold text-sm uppercase text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Rotation & Matchmaking Guidelines</span>
              </span>
              <button
                onClick={() => setHelpOpen(false)}
                className="text-slate-500 hover:text-white font-bold text-xl leading-none cursor-pointer flex items-center justify-center w-6 h-6 rounded-lg hover:bg-slate-900 transition-colors"
                title="Close"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <p>
                This applet is designed specifically for organizing casual, high-rotation club doubles sessions (such as 10-12 players renting 1 or 2 courts for a 2-4 hour evening session).
              </p>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1">
                <h4 className="font-bold text-white uppercase text-[10px]" style={{ color: primaryColor }}>Mode A: Equal Rest & Shuffled Rotation</h4>
                <p className="text-slate-400 leading-normal">
                  Identifies players who have sat out benched the longest (based on rested rounds) and prioritizes them to enter court play next. Ties are randomized dynamically. This guarantees perfectly equal session playtime across all 10-12 players!
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1">
                <h4 className="font-bold text-white uppercase text-[10px]" style={{ color: primaryColor }}>Mode B: Fair Play & Handicap Balance</h4>
                <p className="text-slate-400 leading-normal">
                  First selects players who have benched the longest to guarantee fair play. Once the 4 court players are chosen, they are sorted by net wins. The strongest player (Rank 1) is paired with the developing player (Rank 4), playing against the balanced mid-tier team (Rank 2 + Rank 3). This ensures extremely close, competitive match outcomes!
                </p>
              </div>

              <p>
                <strong>Pro-Tip for Organizers:</strong> Set any player who went to rest, grab food, or left early as <span className="text-amber-400 font-bold">Away (Resting)</span> by clicking their colored status circle in the roster. The matchmaking algorithm will ignore them entirely until you set them back to Available.
              </p>
            </div>

            <button
              onClick={() => setHelpOpen(false)}
              className="w-full py-2.5 rounded-xl font-bold text-xs uppercase text-[#02050e] cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* 7. IMMERSIVE THEATER FULLSCREEN SCOREBOARD */}
      {fullscreenMatchId && (() => {
        const match = activeMatches.find(m => m.id === fullscreenMatchId);
        if (!match) return null;
        
        const courtLabel = match.courtId === 'court_1' ? 'Court 1' : 'Court 2';
        const teamANames = match.teamA.map(getPlayerName).join(' & ');
        const teamBNames = match.teamB.map(getPlayerName).join(' & ');

        const handleNativeFullscreen = () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
              console.warn('Native fullscreen request blocked:', err);
            });
          } else {
            document.exitFullscreen().catch(() => {});
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-[#02050f] flex flex-col justify-between p-6 sm:p-10 animate-fade-in overflow-hidden">
            
            {/* Header branding */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                {config.clubLogoUrl ? (
                  <img src={config.clubLogoUrl} alt="Club" className="h-10 w-auto object-contain bg-slate-950 p-1 rounded-lg border border-slate-800" />
                ) : (
                  <span className="text-xl">{activeSportInfo.emoji}</span>
                )}
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                    {config.clubName}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {courtLabel} — Live Scoreboard
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleNativeFullscreen}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Toggle Fullscreen API"
                >
                  📺 Native Fullscreen
                </button>
                <button
                  onClick={() => setFullscreenMatchId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold uppercase bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-950/40 cursor-pointer transition-all"
                >
                  Exit Scoreboard
                </button>
              </div>
            </div>

            {/* Giant score area with left/right touch points */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 relative gap-4 my-6">
              
              {/* Team A side */}
              <button
                type="button"
                onClick={() => handleUpdateScore(match.id, 'A', 1)}
                className="w-full h-full rounded-2xl bg-slate-950/40 hover:bg-slate-900/10 border border-slate-900 transition-all flex flex-col justify-between p-8 text-left relative focus:outline-none cursor-pointer group/fA active:scale-[0.99]"
                style={{ boxShadow: `0 0 40px -10px ${primaryColor}10` }}
              >
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono">Team A</span>
                  <div className="space-y-1">
                    {match.teamA.map(id => (
                      <h3 key={id} className="text-2xl sm:text-4xl font-black text-white leading-tight">
                        {getPlayerName(id)}
                      </h3>
                    ))}
                  </div>
                </div>
                
                <span 
                  className="text-[10rem] sm:text-[14rem] md:text-[18rem] font-black font-display text-white leading-none mx-auto select-none transition-all group-hover/fA:scale-105"
                  style={{ textShadow: `0 0 40px ${primaryColor}70` }}
                >
                  {match.scoreA}
                </span>

                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-auto">
                  Tap anywhere on left side to Score +1
                </span>
              </button>

              {/* Team B side */}
              <button
                type="button"
                onClick={() => handleUpdateScore(match.id, 'B', 1)}
                className="w-full h-full rounded-2xl bg-slate-950/40 hover:bg-slate-900/10 border border-slate-900 transition-all flex flex-col justify-between p-8 text-right relative focus:outline-none cursor-pointer group/fB active:scale-[0.99]"
                style={{ boxShadow: `0 0 40px -10px ${primaryColor}10` }}
              >
                <div className="space-y-1 text-right">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 font-mono block">Team B</span>
                  <div className="space-y-1">
                    {match.teamB.map(id => (
                      <h3 key={id} className="text-2xl sm:text-4xl font-black text-white leading-tight">
                        {getPlayerName(id)}
                      </h3>
                    ))}
                  </div>
                </div>
                
                <span 
                  className="text-[10rem] sm:text-[14rem] md:text-[18rem] font-black font-display text-white leading-none mx-auto select-none transition-all group-hover/fB:scale-105"
                  style={{ textShadow: `0 0 40px ${primaryColor}70` }}
                >
                  {match.scoreB}
                </span>

                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-auto ml-auto block">
                  Tap anywhere on right side to Score +1
                </span>
              </button>

              {/* Central Divider line with "VS" badge */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex w-12 h-12 rounded-full bg-slate-950 border border-slate-900 items-center justify-center text-xs font-black font-mono text-slate-500 z-20 pointer-events-none">
                VS
              </div>
            </div>

            {/* Bottom Actions footer controls */}
            <div className="px-6 py-4 rounded-2xl bg-slate-950/60 border border-slate-900 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateScore(match.id, 'A', -1)}
                  disabled={match.scoreA === 0}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-xs font-black text-slate-300 border border-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  Undo Team A (-1)
                </button>
                <button
                  onClick={() => handleUpdateScore(match.id, 'B', -1)}
                  disabled={match.scoreB === 0}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-xs font-black text-slate-300 border border-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  Undo Team B (-1)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleDeclareWinner(match.id, 'A');
                    setFullscreenMatchId(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-950 cursor-pointer hover:brightness-110"
                  style={{ backgroundColor: primaryColor }}
                >
                  🏆 Declare Team A Winner
                </button>
                <button
                  onClick={() => {
                    handleDeclareWinner(match.id, 'B');
                    setFullscreenMatchId(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-950 cursor-pointer hover:brightness-110"
                  style={{ backgroundColor: primaryColor }}
                >
                  🏆 Declare Team B Winner
                </button>
              </div>
            </div>

          </div>
        );
      })()}

      {/* FOOTER */}
      <footer className="py-4 text-center text-[10px] text-slate-600 border-t border-slate-950 bg-slate-950/20">
        <span>CourtCraft Club Session Manager · Made for casual rackets & rotation play</span>
      </footer>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Match, Player } from './types';
import { audioService } from './realtime';
import { 
  Tv, 
  Radio, 
  Volume2, 
  VolumeX, 
  ExternalLink, 
  Flame, 
  Sparkles, 
  Eye, 
  Activity, 
  Zap,
  ArrowRight,
  Maximize2
} from 'lucide-react';

export type ViewRole = 'host' | 'court_1' | 'court_2' | 'court_3' | 'court_4' | 'commentator' | 'spectator';

interface LiveCourtFeedProps {
  currentRole: ViewRole;
  activeMatches: Match[];
  players: Player[];
  primaryColor: string;
  sportEmoji: string;
  activeCourts: number;
  lastRemoteAction?: {
    type: string;
    courtId?: string;
    actionDetail?: string;
    timestamp: number;
  } | null;
  onSelectRole: (role: ViewRole) => void;
  onOpenFullscreen?: (matchId: string) => void;
  onQuickScore?: (matchId: string, team: 'A' | 'B', delta: number) => void;
}

export const LiveCourtFeed: React.FC<LiveCourtFeedProps> = ({
  currentRole,
  activeMatches,
  players,
  primaryColor,
  sportEmoji,
  activeCourts,
  lastRemoteAction,
  onSelectRole,
  onOpenFullscreen,
  onQuickScore
}) => {
  const [soundOn, setSoundOn] = useState(audioService.isEnabled());
  const [flashingCourtId, setFlashingCourtId] = useState<string | null>(null);
  const [tickerMessage, setTickerMessage] = useState<string | null>(null);

  // Trigger visual flash and sound chime when remote score updates
  useEffect(() => {
    if (lastRemoteAction && lastRemoteAction.courtId) {
      setFlashingCourtId(lastRemoteAction.courtId);
      if (lastRemoteAction.actionDetail) {
        setTickerMessage(lastRemoteAction.actionDetail);
      }
      const courtNum = lastRemoteAction.courtId === 'court_1' ? 1 : 2;
      audioService.playScoreChime(courtNum);

      const timer = setTimeout(() => {
        setFlashingCourtId(null);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [lastRemoteAction]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audioService.setEnabled(next);
  };

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || id;

  // Determine which courts to display as "Other Court Feeds"
  // If on Court 1, show Court 2 (and 3/4). If on Court 2, show Court 1.
  const isCourtFocus = currentRole.startsWith('court_');
  const targetCourtId = isCourtFocus ? currentRole : null;

  const feedsToDisplay = activeMatches.filter(m => {
    if (isCourtFocus) {
      // In Court Focus mode, show the OTHER courts as live feeds!
      return m.courtId !== targetCourtId;
    }
    // In Host, Commentator, Spectator mode, show ALL courts
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-850 bg-[#040817]/90 backdrop-blur-md p-4 shadow-xl space-y-3">
      {/* Feed Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
          </div>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-white font-mono">
              {isCourtFocus 
                ? (currentRole === 'court_1' ? 'Live Feed: Court 2 & Remote' : 'Live Feed: Court 1 & Remote')
                : 'Cross-Court Live Feeds'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer border ${
              soundOn 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={soundOn ? 'Sound alerts enabled' : 'Sound alerts muted'}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Quick role switcher */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-850 text-[10px] font-bold font-mono">
            <button
              onClick={() => onSelectRole('host')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                currentRole === 'host' ? 'bg-slate-800 text-white font-black' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Host
            </button>
            <button
              onClick={() => onSelectRole('court_1')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                currentRole === 'court_1' ? 'bg-emerald-600 text-white font-black' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              C1
            </button>
            <button
              onClick={() => onSelectRole('court_2')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                currentRole === 'court_2' ? 'bg-emerald-600 text-white font-black' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              C2
            </button>
            <button
              onClick={() => onSelectRole('commentator')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                currentRole === 'commentator' ? 'bg-amber-600 text-white font-black' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              🎙️ Desk
            </button>
          </div>
        </div>
      </div>

      {/* Live Activity Ticker if recent remote point */}
      {tickerMessage && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-300 animate-pulse">
          <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{tickerMessage}</span>
          <span className="ml-auto text-[8px] uppercase tracking-widest text-emerald-500/80">Live</span>
        </div>
      )}

      {/* Feeds Grid */}
      <div className={`grid gap-3 ${feedsToDisplay.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {feedsToDisplay.length === 0 ? (
          <div className="py-5 text-center text-slate-500 text-xs font-mono bg-slate-950/30 rounded-xl border border-slate-900">
            <span>{sportEmoji} No live matches active on other courts right now.</span>
          </div>
        ) : (
          feedsToDisplay.map((match) => {
            const courtNum = match.courtId === 'court_1' ? '1' : match.courtId === 'court_2' ? '2' : match.courtId === 'court_3' ? '3' : '4';
            const isFlashing = flashingCourtId === match.courtId;
            const diff = Math.abs(match.scoreA - match.scoreB);
            const isMatchPoint = Math.max(match.scoreA, match.scoreB) >= 10 && diff >= 1;
            const isDeuce = match.scoreA >= 10 && match.scoreB >= 10 && diff === 0;

            const teamANames = match.teamA.map(getPlayerName).join(' & ');
            const teamBNames = match.teamB.map(getPlayerName).join(' & ');

            return (
              <div
                key={match.id}
                className={`relative rounded-xl border transition-all duration-300 p-3.5 flex flex-col justify-between gap-3 overflow-hidden ${
                  isFlashing
                    ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400'
                    : 'border-slate-850 bg-slate-950/60 hover:border-slate-750'
                }`}
              >
                {/* Court Tag & Status Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider font-mono"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      Court {courtNum}
                    </span>
                    {isMatchPoint && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        🔥 Game Point
                      </span>
                    )}
                    {isDeuce && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wide bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        ⚡ Deuce
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenFullscreen && (
                      <button
                        onClick={() => onOpenFullscreen(match.id)}
                        className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Open Fullscreen Broadcast Scoreboard"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectRole(`court_${courtNum}` as ViewRole)}
                      className="text-[9px] font-bold text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer hover:underline"
                      title={`Switch view to Court ${courtNum}`}
                    >
                      <span>Jump</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Score HUD Display */}
                <div className="grid grid-cols-7 items-center gap-2 py-1">
                  {/* Team A */}
                  <div className="col-span-3 text-left">
                    <p className="text-xs font-black text-white truncate" title={teamANames}>
                      {teamANames}
                    </p>
                    <span className="text-[8px] font-bold uppercase font-mono text-slate-500">Team A</span>
                  </div>

                  {/* Big Live Digital Score */}
                  <div className="col-span-1 text-center font-mono font-black text-2xl text-white">
                    {match.scoreA}
                  </div>

                  <div className="col-span-1 text-center text-slate-600 font-mono text-xs font-bold">
                    :
                  </div>

                  <div className="col-span-1 text-center font-mono font-black text-2xl text-white">
                    {match.scoreB}
                  </div>

                  {/* Team B */}
                  <div className="col-span-1 text-right">
                    <p className="text-xs font-black text-white truncate" title={teamBNames}>
                      {teamBNames}
                    </p>
                    <span className="text-[8px] font-bold uppercase font-mono text-slate-500">Team B</span>
                  </div>
                </div>

                {/* Quick Scorer Controls if authorized */}
                {onQuickScore && (
                  <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between text-[9px] font-mono">
                    <button
                      onClick={() => onQuickScore(match.id, 'A', 1)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 transition-colors cursor-pointer"
                    >
                      +1 Team A
                    </button>
                    <span className="text-slate-600">Syncing live across all phones</span>
                    <button
                      onClick={() => onQuickScore(match.id, 'B', 1)}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 transition-colors cursor-pointer"
                    >
                      +1 Team B
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

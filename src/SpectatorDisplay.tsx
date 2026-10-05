import React, { useState, useEffect } from 'react';
import { Match, Player, SessionConfig } from './types';
import { audioService } from './realtime';
import { ArrowLeft, Maximize2, Tv, Sparkles, Flame, Share2 } from 'lucide-react';

interface SpectatorDisplayProps {
  config: SessionConfig;
  players: Player[];
  activeMatches: Match[];
  completedMatches: Match[];
  primaryColor: string;
  sportEmoji: string;
  lastRemoteAction?: {
    type: string;
    courtId?: string;
    actionDetail?: string;
    timestamp: number;
  } | null;
  onBackToHost: () => void;
  onOpenMultiDevice: () => void;
}

export const SpectatorDisplay: React.FC<SpectatorDisplayProps> = ({
  config,
  players,
  activeMatches,
  completedMatches,
  primaryColor,
  sportEmoji,
  lastRemoteAction,
  onBackToHost,
  onOpenMultiDevice
}) => {
  const [flashingCourtId, setFlashingCourtId] = useState<string | null>(null);

  useEffect(() => {
    if (lastRemoteAction && lastRemoteAction.courtId) {
      setFlashingCourtId(lastRemoteAction.courtId);
      const courtNum = lastRemoteAction.courtId === 'court_1' ? 1 : 2;
      audioService.playScoreChime(courtNum);

      const timer = setTimeout(() => {
        setFlashingCourtId(null);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [lastRemoteAction]);

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || id;

  const toggleNativeFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#02050f] text-slate-100 flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top TV Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div className="flex items-center gap-4">
          {config.clubLogoUrl ? (
            <img src={config.clubLogoUrl} alt="Club Logo" className="h-12 w-auto object-contain rounded-xl border border-slate-800 bg-slate-950 p-1" />
          ) : (
            <span className="text-3xl">{sportEmoji}</span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white font-mono">
                {config.clubName || 'CourtCraft Club Session'}
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Broadcast
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Live Courtside Scoreboard · Multi-Screen Feed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleNativeFullscreen}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Fullscreen TV</span>
          </button>

          <button
            onClick={onOpenMultiDevice}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Device QR and Share Links"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={onBackToHost}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Host Controls</span>
          </button>
        </div>
      </div>

      {/* Courts Live Display Grid */}
      <div className="my-auto py-8">
        {activeMatches.length === 0 ? (
          <div className="text-center py-24 space-y-4 bg-slate-950/40 rounded-3xl border border-slate-900 max-w-xl mx-auto p-8">
            <span className="text-5xl">{sportEmoji}</span>
            <h2 className="text-xl font-bold font-mono text-white">Courts Currently Resting</h2>
            <p className="text-xs text-slate-400">
              The next round of matches is being prepared by the host. Live scores will stream here automatically.
            </p>
          </div>
        ) : (
          <div className={`grid gap-8 ${activeMatches.length > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-3xl mx-auto'}`}>
            {activeMatches.map((match) => {
              const courtNum = match.courtId === 'court_1' ? '1' : match.courtId === 'court_2' ? '2' : match.courtId === 'court_3' ? '3' : '4';
              const isFlashing = flashingCourtId === match.courtId;
              const teamANames = match.teamA.map(getPlayerName).join(' & ');
              const teamBNames = match.teamB.map(getPlayerName).join(' & ');
              const diff = Math.abs(match.scoreA - match.scoreB);
              const isMatchPoint = Math.max(match.scoreA, match.scoreB) >= 10 && diff >= 1;
              const isDeuce = match.scoreA >= 10 && match.scoreB >= 10 && diff === 0;

              return (
                <div
                  key={match.id}
                  className={`rounded-3xl border transition-all duration-300 p-8 shadow-2xl space-y-6 relative overflow-hidden ${
                    isFlashing
                      ? 'border-emerald-400 bg-emerald-950/30 shadow-2xl shadow-emerald-500/20 ring-2 ring-emerald-400'
                      : 'border-slate-800 bg-slate-950/70'
                  }`}
                >
                  {/* Top Court Pill & Status */}
                  <div className="flex items-center justify-between">
                    <span 
                      className="px-4 py-1.5 rounded-xl text-sm font-black font-mono uppercase tracking-wider"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      Court {courtNum}
                    </span>

                    <div className="flex items-center gap-2">
                      {isMatchPoint && (
                        <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1 font-mono">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          Game Point
                        </span>
                      )}
                      {isDeuce && (
                        <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                          ⚡ Deuce
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-500">Live</span>
                    </div>
                  </div>

                  {/* Main Giant Scores */}
                  <div className="grid grid-cols-7 items-center gap-4 py-4">
                    {/* Team A */}
                    <div className="col-span-3 space-y-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider">Team A</span>
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                        {teamANames}
                      </h3>
                    </div>

                    {/* Score A */}
                    <div 
                      className="col-span-1 text-center text-7xl sm:text-8xl font-black font-display text-white"
                      style={{ textShadow: `0 0 30px ${primaryColor}70` }}
                    >
                      {match.scoreA}
                    </div>

                    {/* Colon */}
                    <div className="col-span-1 text-center text-slate-600 font-mono text-2xl font-bold">
                      :
                    </div>

                    {/* Score B */}
                    <div 
                      className="col-span-1 text-center text-7xl sm:text-8xl font-black font-display text-white"
                      style={{ textShadow: `0 0 30px ${primaryColor}70` }}
                    >
                      {match.scoreB}
                    </div>

                    {/* Team B */}
                    <div className="col-span-1 space-y-1 text-right">
                      <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider">Team B</span>
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                        {teamBNames}
                      </h3>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900/80 flex items-center justify-between text-xs font-mono text-slate-500">
                    <span>Rotation Match #{completedMatches.length + 1}</span>
                    <span>Synchronized Live Feed</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Ticker */}
      <footer className="border-t border-slate-900 pt-4 flex items-center justify-between text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>CourtCraft Live Multi-Screen Network</span>
        </div>
        <span>Completed Matches Today: {completedMatches.length}</span>
      </footer>
    </div>
  );
};

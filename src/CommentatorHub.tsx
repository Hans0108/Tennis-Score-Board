import React, { useState } from 'react';
import { Match, Player, SessionConfig } from './types';
import { audioService } from './realtime';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  Flame, 
  Maximize2, 
  Zap, 
  Trophy, 
  Clock, 
  Activity, 
  ArrowLeft,
  Share2,
  FileText
} from 'lucide-react';

interface CommentatorAction {
  id: string;
  courtId: string;
  detail: string;
  timestamp: number;
}

interface CommentatorHubProps {
  config: SessionConfig;
  players: Player[];
  activeMatches: Match[];
  completedMatches: Match[];
  primaryColor: string;
  sportEmoji: string;
  recentActions: CommentatorAction[];
  onBackToHost: () => void;
  onOpenFullscreen: (matchId: string) => void;
  onScoreUpdate: (matchId: string, team: 'A' | 'B', delta: number) => void;
  onOpenMultiDevice: () => void;
}

export const CommentatorHub: React.FC<CommentatorHubProps> = ({
  config,
  players,
  activeMatches,
  completedMatches,
  primaryColor,
  sportEmoji,
  recentActions,
  onBackToHost,
  onOpenFullscreen,
  onScoreUpdate,
  onOpenMultiDevice
}) => {
  const [soundOn, setSoundOn] = useState(audioService.isEnabled());
  const [notes, setNotes] = useState('');

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audioService.setEnabled(next);
  };

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || id;

  return (
    <div className="min-h-screen bg-[#02050f] text-slate-100 flex flex-col justify-between">
      {/* Top Commentator Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 px-6 py-4 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHost}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800 flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit Desk</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xl">🎙️</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black uppercase tracking-tight font-mono text-white">
                    Broadcast & Commentator Desk
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Live On Air
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  Multi-court live feed monitoring · {activeMatches.length} Active Games
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleSound}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                soundOn 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundOn ? 'Audio Alerts ON' : 'Audio Muted'}</span>
            </button>

            <button
              onClick={onOpenMultiDevice}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Court Links</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid: Split Court Feeds + Live Activity Ticker */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Split-Screen Live Courts (8 Cols) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider font-mono text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: primaryColor }} />
              <span>Live Court Feeds (Dual Monitoring)</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Scores sync instantly across all devices</span>
          </div>

          {activeMatches.length === 0 ? (
            <div className="py-20 text-center bg-slate-950/40 rounded-3xl border border-slate-900 p-8 space-y-3">
              <span className="text-4xl">{sportEmoji}</span>
              <h3 className="text-base font-bold text-slate-300 font-mono">No Active Matches on Court</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Once matches are assigned by the tournament host, live scoring feeds will stream here in real time.
              </p>
              <button
                onClick={onBackToHost}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase text-slate-950 font-mono cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                Go to Matchmaking Controls
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeMatches.map((match) => {
                const courtNum = match.courtId === 'court_1' ? '1' : match.courtId === 'court_2' ? '2' : match.courtId === 'court_3' ? '3' : '4';
                const teamANames = match.teamA.map(getPlayerName).join(' & ');
                const teamBNames = match.teamB.map(getPlayerName).join(' & ');
                const diff = Math.abs(match.scoreA - match.scoreB);
                const isMatchPoint = Math.max(match.scoreA, match.scoreB) >= 10 && diff >= 1;
                const isDeuce = match.scoreA >= 10 && match.scoreB >= 10 && diff === 0;

                return (
                  <div
                    key={match.id}
                    className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5 shadow-2xl space-y-4 relative overflow-hidden"
                  >
                    {/* Top Court Banner */}
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                      <div className="flex items-center gap-2">
                        <span 
                          className="px-2.5 py-1 rounded-lg text-xs font-black font-mono uppercase"
                          style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                        >
                          Court {courtNum}
                        </span>
                        {isMatchPoint && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-400" />
                            Game Point
                          </span>
                        )}
                        {isDeuce && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            ⚡ Deuce
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onOpenFullscreen(match.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                        title="Broadcast Scoreboard View"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Team Players Comparison */}
                    <div className="space-y-4 py-2">
                      {/* Team A Row */}
                      <div className="flex items-center justify-between bg-slate-900/30 p-3.5 rounded-2xl border border-slate-850">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-bold uppercase text-slate-500 tracking-wider">Team A</span>
                          <p className="text-sm font-black text-white">{teamANames}</p>
                        </div>
                        <span 
                          className="text-4xl font-black font-display text-white"
                          style={{ textShadow: `0 0 15px ${primaryColor}50` }}
                        >
                          {match.scoreA}
                        </span>
                      </div>

                      {/* Team B Row */}
                      <div className="flex items-center justify-between bg-slate-900/30 p-3.5 rounded-2xl border border-slate-850">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-bold uppercase text-slate-500 tracking-wider">Team B</span>
                          <p className="text-sm font-black text-white">{teamBNames}</p>
                        </div>
                        <span 
                          className="text-4xl font-black font-display text-white"
                          style={{ textShadow: `0 0 15px ${primaryColor}50` }}
                        >
                          {match.scoreB}
                        </span>
                      </div>
                    </div>

                    {/* Quick Umpire / Co-Scoring Override */}
                    <div className="pt-2 border-t border-slate-900 grid grid-cols-2 gap-2 text-xs font-mono">
                      <button
                        onClick={() => onScoreUpdate(match.id, 'A', 1)}
                        className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 transition-colors cursor-pointer active:scale-95"
                      >
                        +1 Point Team A
                      </button>
                      <button
                        onClick={() => onScoreUpdate(match.id, 'B', 1)}
                        className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 transition-colors cursor-pointer active:scale-95"
                      >
                        +1 Point Team B
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Side: Play-by-Play Live Ticker & Commentator Notepad (4 Cols) */}
        <section className="lg:col-span-4 space-y-6">
          
          {/* Live Play-by-Play Activity Stream */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Play-by-Play Feed</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Feed
              </span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 font-mono">
              {recentActions.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-600">
                  <span>Score events from Court 1 and Court 2 will stream here live as points are awarded!</span>
                </div>
              ) : (
                recentActions.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-850 flex items-start gap-2.5 text-[11px]"
                  >
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-800 text-slate-300 shrink-0">
                      {act.courtId === 'court_1' ? 'C1' : 'C2'}
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-slate-200 font-semibold">{act.detail}</p>
                      <span className="text-[9px] text-slate-500">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Commentator Scratchpad */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Commentator Notes</span>
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot down notes, player highlights, break points, or speaking points during live court rotations..."
              className="w-full h-28 bg-slate-900/60 border border-slate-850 rounded-2xl p-3 text-xs text-slate-200 focus:outline-none focus:border-slate-700 resize-none font-mono"
            />
            <p className="text-[9px] text-slate-500 font-mono italic">
              Notes are kept locally on your commentator desk device.
            </p>
          </div>

        </section>

      </main>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Match, Player, SessionConfig } from './types';
import { audioService } from './realtime';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  ArrowLeft, 
  Share2, 
  Trophy, 
  Flame, 
  Zap, 
  ChevronRight,
  Eye,
  Tv
} from 'lucide-react';

interface CourtFocusScorerProps {
  courtId: 'court_1' | 'court_2' | 'court_3' | 'court_4';
  config: SessionConfig;
  players: Player[];
  activeMatches: Match[];
  primaryColor: string;
  sportEmoji: string;
  lastRemoteAction?: {
    type: string;
    courtId?: string;
    actionDetail?: string;
    timestamp: number;
  } | null;
  onBackToHost: () => void;
  onUpdateScore: (matchId: string, team: 'A' | 'B', delta: number) => void;
  onDeclareWinner: (matchId: string, winningTeam: 'A' | 'B') => void;
  onOpenFullscreen: (matchId: string) => void;
  onOpenMultiDevice: () => void;
  onSwitchCourt: (newCourtId: 'court_1' | 'court_2' | 'court_3' | 'court_4') => void;
}

export const CourtFocusScorer: React.FC<CourtFocusScorerProps> = ({
  courtId,
  config,
  players,
  activeMatches,
  primaryColor,
  sportEmoji,
  lastRemoteAction,
  onBackToHost,
  onUpdateScore,
  onDeclareWinner,
  onOpenFullscreen,
  onOpenMultiDevice,
  onSwitchCourt
}) => {
  const [soundOn, setSoundOn] = useState(audioService.isEnabled());
  const [otherCourtFlash, setOtherCourtFlash] = useState(false);
  const [tickerMessage, setTickerMessage] = useState<string | null>(null);

  const thisCourtNum = courtId === 'court_1' ? '1' : courtId === 'court_2' ? '2' : courtId === 'court_3' ? '3' : '4';
  const otherCourtId = courtId === 'court_1' ? 'court_2' : 'court_1';
  const otherCourtNum = otherCourtId === 'court_1' ? '1' : '2';

  const thisMatch = activeMatches.find(m => m.courtId === courtId);
  const otherMatch = activeMatches.find(m => m.courtId === otherCourtId);

  // Flash other court feed if remote point was scored on the other court!
  useEffect(() => {
    if (lastRemoteAction && lastRemoteAction.courtId === otherCourtId) {
      setOtherCourtFlash(true);
      if (lastRemoteAction.actionDetail) {
        setTickerMessage(lastRemoteAction.actionDetail);
      }
      audioService.playScoreChime(parseInt(otherCourtNum, 10));

      const timer = setTimeout(() => {
        setOtherCourtFlash(false);
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [lastRemoteAction, otherCourtId, otherCourtNum]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audioService.setEnabled(next);
  };

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || id;

  return (
    <div className="min-h-screen bg-[#02050f] text-slate-100 flex flex-col justify-between select-none">
      
      {/* Top Scorer Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 px-4 py-3 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToHost}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800 flex items-center gap-1.5 text-xs font-mono"
            title="Return to Master Host Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Host View</span>
          </button>

          <div className="flex items-center gap-2">
            <span 
              className="px-2.5 py-1 rounded-xl text-xs font-black uppercase font-mono tracking-wider border"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor, borderColor: `${primaryColor}40` }}
            >
              Court {thisCourtNum} Scorer
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Sync
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick jump to Court 2 */}
          <button
            onClick={() => onSwitchCourt(otherCourtId)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
            title={`Switch scorer to Court ${otherCourtNum}`}
          >
            <span>Jump to C{otherCourtNum}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl text-xs transition-colors cursor-pointer border ${
              soundOn 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title={soundOn ? 'Sound alerts on' : 'Sound alerts muted'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenMultiDevice}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Connect other phones & QR code"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl w-full mx-auto px-4 py-4 flex-1 flex flex-col justify-between gap-4">
        
        {/* RECIPROCAL LIVE FEED OF OTHER COURT (Court 1 sees Court 2, Court 2 sees Court 1) */}
        <div 
          className={`rounded-2xl border transition-all duration-300 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 ${
            otherCourtFlash
              ? 'border-emerald-400 bg-emerald-950/40 shadow-lg shadow-emerald-500/25 ring-1 ring-emerald-400'
              : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono font-black uppercase text-emerald-400">
                Court {otherCourtNum} Live Feed
              </span>
            </div>

            {otherMatch ? (
              <div className="text-xs font-mono text-slate-300 truncate">
                <span className="font-bold text-white">{otherMatch.teamA.map(getPlayerName).join(' & ')}</span>
                <span className="text-slate-500 mx-2">vs</span>
                <span className="font-bold text-white">{otherMatch.teamB.map(getPlayerName).join(' & ')}</span>
              </div>
            ) : (
              <span className="text-xs font-mono text-slate-500">Court {otherCourtNum} is currently resting / open</span>
            )}
          </div>

          <div className="flex items-center gap-4 self-end sm:self-center">
            {otherMatch && (
              <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-800 font-mono font-black text-base text-white">
                <span className="text-emerald-400">{otherMatch.scoreA}</span>
                <span className="text-slate-600">:</span>
                <span className="text-cyan-400">{otherMatch.scoreB}</span>
              </div>
            )}

            {tickerMessage && (
              <span className="text-[10px] font-mono text-emerald-300 truncate max-w-[200px] animate-pulse">
                {tickerMessage}
              </span>
            )}

            {otherMatch && (
              <button
                onClick={() => onOpenFullscreen(otherMatch.id)}
                className="text-[10px] font-mono font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>View C{otherCourtNum}</span>
                <Tv className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* THIS COURT LIVE SCORING CARDS */}
        {!thisMatch ? (
          <div className="py-20 text-center bg-slate-950/40 rounded-3xl border border-slate-900 p-8 space-y-4 my-auto">
            <span className="text-5xl">{sportEmoji}</span>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white font-mono uppercase">Court {thisCourtNum} is Open</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No active match is currently assigned to Court {thisCourtNum}. Switch back to the Master Host dashboard to allocate benched players, or auto-assign a match.
              </p>
            </div>
            <button
              onClick={onBackToHost}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase text-slate-950 font-mono cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              Go to Host Controls
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between gap-4">
            
            {/* Giant Split Touch Scoreboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 my-auto">
              
              {/* Team A Half */}
              <button
                type="button"
                onClick={() => onUpdateScore(thisMatch.id, 'A', 1)}
                className="rounded-3xl bg-slate-950/70 hover:bg-slate-900/40 border border-slate-850 p-6 flex flex-col justify-between text-left transition-all active:scale-[0.98] cursor-pointer group shadow-xl relative overflow-hidden"
              >
                <div className="space-y-1 z-10">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Team A · Tap to Score +1
                  </span>
                  <div className="space-y-0.5">
                    {thisMatch.teamA.map(id => (
                      <h3 key={id} className="text-xl sm:text-2xl font-black text-white leading-tight">
                        {getPlayerName(id)}
                      </h3>
                    ))}
                  </div>
                </div>

                <div className="my-auto py-6 text-center z-10">
                  <span 
                    className="text-8xl sm:text-9xl font-black font-display text-white transition-transform group-hover:scale-105 inline-block"
                    style={{ textShadow: `0 0 35px ${primaryColor}70` }}
                  >
                    {thisMatch.scoreA}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 z-10">
                  <span>+1 Point</span>
                  <span className="text-slate-600">Court {thisCourtNum}</span>
                </div>
              </button>

              {/* Team B Half */}
              <button
                type="button"
                onClick={() => onUpdateScore(thisMatch.id, 'B', 1)}
                className="rounded-3xl bg-slate-950/70 hover:bg-slate-900/40 border border-slate-850 p-6 flex flex-col justify-between text-right transition-all active:scale-[0.98] cursor-pointer group shadow-xl relative overflow-hidden"
              >
                <div className="space-y-1 z-10">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Team B · Tap to Score +1
                  </span>
                  <div className="space-y-0.5">
                    {thisMatch.teamB.map(id => (
                      <h3 key={id} className="text-xl sm:text-2xl font-black text-white leading-tight">
                        {getPlayerName(id)}
                      </h3>
                    ))}
                  </div>
                </div>

                <div className="my-auto py-6 text-center z-10">
                  <span 
                    className="text-8xl sm:text-9xl font-black font-display text-white transition-transform group-hover:scale-105 inline-block"
                    style={{ textShadow: `0 0 35px ${primaryColor}70` }}
                  >
                    {thisMatch.scoreB}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 z-10">
                  <span className="text-slate-600">Court {thisCourtNum}</span>
                  <span>+1 Point</span>
                </div>
              </button>

            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-slate-950/80 border border-slate-900 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateScore(thisMatch.id, 'A', -1)}
                  disabled={thisMatch.scoreA === 0}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-xs font-mono font-bold text-slate-300 border border-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  Undo Team A (-1)
                </button>
                <button
                  onClick={() => onUpdateScore(thisMatch.id, 'B', -1)}
                  disabled={thisMatch.scoreB === 0}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-850 rounded-xl text-xs font-mono font-bold text-slate-300 border border-slate-800 disabled:opacity-30 cursor-pointer"
                >
                  Undo Team B (-1)
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onDeclareWinner(thisMatch.id, 'A')}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black uppercase text-slate-950 cursor-pointer hover:brightness-110 font-mono flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Team A Won</span>
                </button>
                <button
                  onClick={() => onDeclareWinner(thisMatch.id, 'B')}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black uppercase text-slate-950 cursor-pointer hover:brightness-110 font-mono flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Team B Won</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
};

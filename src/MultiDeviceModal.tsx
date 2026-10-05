import React, { useState } from 'react';
import { ViewRole } from './LiveCourtFeed';
import { ConnectedDevice } from './realtime';
import { 
  X, 
  Smartphone, 
  Copy, 
  Check, 
  Share2, 
  Tv, 
  Radio, 
  Trophy, 
  Wifi, 
  ExternalLink,
  Users,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface MultiDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedCount: number;
  connectedDevices: ConnectedDevice[];
  currentRole: ViewRole;
  primaryColor: string;
  onSelectRole: (role: ViewRole) => void;
}

export const MultiDeviceModal: React.FC<MultiDeviceModalProps> = ({
  isOpen,
  onClose,
  connectedCount,
  connectedDevices,
  currentRole,
  primaryColor,
  onSelectRole
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const getRoleUrl = (role: ViewRole) => {
    return `${origin}${pathname}?view=${role}`;
  };

  const handleCopy = (key: string, url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      });
    }
  };

  const handleNativeShare = (title: string, url: string) => {
    if (navigator.share) {
      navigator.share({
        title: `CourtCraft Live - ${title}`,
        text: `Live real-time feed for ${title}`,
        url
      }).catch(() => {});
    } else {
      handleCopy(title, url);
    }
  };

  const roleConfigs = [
    {
      role: 'court_1' as ViewRole,
      title: 'Court 1 Scorer Phone / Tablet',
      desc: 'Big touch buttons for Court 1 umpire with live Court 2 feed',
      icon: '🎾',
      badge: 'Court 1 Feed'
    },
    {
      role: 'court_2' as ViewRole,
      title: 'Court 2 Scorer Phone / Tablet',
      desc: 'Big touch buttons for Court 2 umpire with live Court 1 feed',
      icon: '🎾',
      badge: 'Court 2 Feed'
    },
    {
      role: 'commentator' as ViewRole,
      title: 'Commentator / Broadcast Desk',
      desc: 'Dual-court side-by-side feed with momentum badges & audio cues',
      icon: '🎙️',
      badge: 'Commentator'
    },
    {
      role: 'spectator' as ViewRole,
      title: 'Clubhouse TV / Spectator Board',
      desc: 'Full-screen read-only scoreboard for TV displays in lounge',
      icon: '📺',
      badge: 'Spectator'
    },
    {
      role: 'host' as ViewRole,
      title: 'Host / Tournament Director',
      desc: 'Master control dashboard with matchmaking rotations & timer',
      icon: '👑',
      badge: 'Master Control'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[#030713] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-fade-in max-h-[90vh] overflow-y-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center border font-mono text-base"
              style={{ borderColor: primaryColor, color: primaryColor, backgroundColor: `${primaryColor}15` }}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wide text-white font-mono flex items-center gap-2">
                <span>Multi-Device Live Feeds</span>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-sans font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {connectedCount} {connectedCount === 1 ? 'Device' : 'Devices'} Online
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Score on Court 1, monitor Court 2 live from any phone, tablet, or laptop
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* How It Works Banner */}
        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-xl">
            ⚡
          </div>
          <div className="space-y-1 text-center sm:text-left flex-1">
            <p className="font-extrabold text-white">Sub-millisecond WebSocket Synchronization</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Open any of the links below on other devices. When Court 1 scores, Court 2 and the Commentator Desk see it immediately in real-time, complete with live feed tickers and sound cues!
            </p>
          </div>
        </div>

        {/* Role Links Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Select or Share Role Links</span>
          </h3>

          <div className="grid gap-3">
            {roleConfigs.map((rc) => {
              const url = getRoleUrl(rc.role);
              const isCurrent = currentRole === rc.role;
              const isCopied = copiedKey === rc.role;

              return (
                <div
                  key={rc.role}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-slate-900/60 border-slate-700 shadow-md ring-1 ring-slate-600'
                      : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{rc.icon}</span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{rc.title}</span>
                        {isCurrent && (
                          <span 
                            className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded"
                            style={{ backgroundColor: `${primaryColor}25`, color: primaryColor }}
                          >
                            Active on this screen
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{rc.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isCurrent && (
                      <button
                        onClick={() => {
                          onSelectRole(rc.role);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold font-mono transition-colors cursor-pointer border border-slate-800"
                        title="Switch this device to this role"
                      >
                        Switch Role
                      </button>
                    )}

                    <button
                      onClick={() => handleCopy(rc.role, url)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isCopied
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                      title="Copy link to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleNativeShare(rc.title, url)}
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
                      title="Share link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connected Devices List */}
        <div className="pt-2 border-t border-slate-900 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Connected Devices ({connectedCount})</span>
            </span>
            <span className="text-[10px] text-slate-500">Live Heartbeat Active</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {connectedDevices.length === 0 ? (
              <span className="text-xs text-slate-600 font-mono italic">Sync server ready for connections</span>
            ) : (
              connectedDevices.map((d, i) => (
                <div 
                  key={d.id || i}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-850 flex items-center gap-1.5 text-[11px] font-mono text-slate-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-bold">{d.label || d.role}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-950 cursor-pointer hover:brightness-110 transition-all font-mono"
            style={{ backgroundColor: primaryColor }}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

// Real-time synchronization service and multi-device connection manager

export interface ConnectedDevice {
  id: string;
  role: string;
  label: string;
}

export interface StateUpdateEvent {
  payload: any;
  senderId?: string;
  action?: string;
  courtId?: string;
  actionDetail?: string;
  timestamp: number;
}

// Web Audio API synthesizer for sound effects (zero external assets required)
class AudioService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    const saved = localStorage.getItem('courtcraft_sound_enabled');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('courtcraft_sound_enabled', enabled ? 'true' : 'false');
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Pleasant double-beep when a point is scored
  public playScoreChime(courtNum: number = 1) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Higher pitch for Court 1, slightly lower for Court 2 for instant audio differentiation!
      const baseFreq = courtNum === 1 ? 660 : 520;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Triumphant chime when a match is won / completed
  public playVictoryFanfare() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

export const audioService = new AudioService();

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private deviceId: string;
  private role: string = 'host';
  private label: string = 'Host Device';
  private connected: boolean = false;
  private reconnectTimer: any = null;
  private listeners: Set<(event: StateUpdateEvent) => void> = new Set();
  private presenceListeners: Set<(count: number, devices: ConnectedDevice[]) => void> = new Set();
  private statusListeners: Set<(connected: boolean) => void> = new Set();
  private connectedDevicesCount: number = 1;
  private connectedDevicesList: ConnectedDevice[] = [];

  constructor() {
    let savedId = sessionStorage.getItem('courtcraft_device_id');
    if (!savedId) {
      savedId = 'dev_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('courtcraft_device_id', savedId);
    }
    this.deviceId = savedId;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getConnectedDevicesCount(): number {
    return this.connectedDevicesCount;
  }

  public getConnectedDevicesList(): ConnectedDevice[] {
    return this.connectedDevicesList;
  }

  public setRole(role: string, label: string) {
    this.role = role;
    this.label = label;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'REGISTER_DEVICE',
        deviceId: this.deviceId,
        role: this.role,
        label: this.label
      }));
    }
  }

  public onStateUpdate(cb: (event: StateUpdateEvent) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public onPresence(cb: (count: number, devices: ConnectedDevice[]) => void) {
    this.presenceListeners.add(cb);
    return () => this.presenceListeners.delete(cb);
  }

  public onStatusChange(cb: (connected: boolean) => void) {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connected = true;
        this.notifyStatus(true);
        // Register device identity and current role
        this.ws?.send(JSON.stringify({
          type: 'REGISTER_DEVICE',
          deviceId: this.deviceId,
          role: this.role,
          label: this.label
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT_STATE' || data.type === 'STATE_UPDATED') {
            const updateEvent: StateUpdateEvent = {
              payload: data.payload,
              senderId: data.senderId,
              action: data.action,
              courtId: data.courtId,
              actionDetail: data.actionDetail,
              timestamp: data.timestamp || Date.now()
            };
            for (const listener of this.listeners) {
              listener(updateEvent);
            }
          } else if (data.type === 'PRESENCE_UPDATE') {
            this.connectedDevicesCount = data.count || 1;
            this.connectedDevicesList = data.devices || [];
            for (const listener of this.presenceListeners) {
              listener(this.connectedDevicesCount, this.connectedDevicesList);
            }
          }
        } catch (err) {
          console.error('Failed to parse realtime message:', err);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.notifyStatus(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.connected = false;
        this.notifyStatus(false);
      };
    } catch (err) {
      console.error('WebSocket connection initialization failed:', err);
      this.scheduleReconnect();
    }
  }

  private notifyStatus(status: boolean) {
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  public broadcast(state: any, action?: string, courtId?: string, actionDetail?: string) {
    const payload = {
      type: 'SYNC_STATE',
      payload: state,
      senderId: this.deviceId,
      action,
      courtId,
      actionDetail
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      // Fallback via HTTP REST POST if socket is temporarily reconnecting
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          senderId: this.deviceId,
          action,
          courtId,
          actionDetail
        })
      }).catch(err => {
        console.warn('REST fallback broadcast failed:', err);
      });
    }
  }

  // Initial bootstrap fetch via REST API for instant paint
  public async fetchServerState(): Promise<any | null> {
    try {
      const res = await fetch('/api/session');
      if (res.ok) {
        const data = await res.json();
        if (data.connectedDevicesCount) {
          this.connectedDevicesCount = data.connectedDevicesCount;
          this.connectedDevicesList = data.devices || [];
        }
        return data.state || null;
      }
    } catch {
      // In local offline fallback
    }
    return null;
  }
}

export const realtimeClient = new RealtimeClient();

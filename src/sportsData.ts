import { SportType } from './types';

export interface SportInfo {
  id: SportType;
  name: string;
  emoji: string;
  primaryColor: string; // Tailwind Hex
  accentColor: string;
  glowClass: string;
  defaultPoints: number; // Default game duration points (e.g., 11 or 21)
}

export const SPORTS_LIST: SportInfo[] = [
  {
    id: 'tennis',
    name: 'Tennis',
    emoji: '🎾',
    primaryColor: '#ccff00', // Electric Lime
    accentColor: 'lime-400',
    glowClass: 'glow-neon-lime',
    defaultPoints: 11,
  },
  {
    id: 'padel',
    name: 'Padel',
    emoji: '🦇',
    primaryColor: '#ff007f', // Hot Pink
    accentColor: 'pink-500',
    glowClass: 'glow-neon-magenta',
    defaultPoints: 11,
  },
  {
    id: 'pickleball',
    name: 'Pickleball',
    emoji: '🏓',
    primaryColor: '#ff5e00', // Electric Orange
    accentColor: 'amber-500',
    glowClass: 'glow-neon-orange',
    defaultPoints: 11,
  },
  {
    id: 'badminton',
    name: 'Badminton',
    emoji: '🏸',
    primaryColor: '#00ffcc', // Neon Teal
    accentColor: 'emerald-400',
    glowClass: 'glow-neon-teal',
    defaultPoints: 21,
  },
  {
    id: 'table_tennis',
    name: 'Table Tennis',
    emoji: '🔴',
    primaryColor: '#00d4ff', // Lightning Blue
    accentColor: 'sky-400',
    glowClass: 'glow-neon-blue',
    defaultPoints: 11,
  }
];

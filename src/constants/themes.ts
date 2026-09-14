import type { ThemeId } from '../types/race';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  previewColors: {
    bg: string;
    primary: string;
    accent: string;
  };
  attributes: {
    hasScanlines: boolean;
    fontFamily: string;
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    tagline: 'Deep void with electric cyan & hot violet',
    previewColors: {
      bg: '#090A0F',
      primary: '#00F5FF',
      accent: '#39FF14',
    },
    attributes: {
      hasScanlines: false,
      fontFamily: 'JetBrains Mono',
    }
  },
  amber: {
    id: 'amber',
    name: 'Amber Terminal',
    tagline: 'Vintage 1980s phosphor CRT cathode display',
    previewColors: {
      bg: '#0C0D0A',
      primary: '#FFB000',
      accent: '#FF8400',
    },
    attributes: {
      hasScanlines: true,
      fontFamily: 'JetBrains Mono',
    }
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula Slate',
    tagline: 'Modern midnight slate with pastel purple & pink',
    previewColors: {
      bg: '#191A21',
      primary: '#BD93F9',
      accent: '#50FA7B',
    },
    attributes: {
      hasScanlines: false,
      fontFamily: 'JetBrains Mono',
    }
  }
};

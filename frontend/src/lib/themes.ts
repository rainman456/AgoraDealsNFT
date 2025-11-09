export type ThemeName = 
  | 'default'
  | 'neomint'
  | 'digital-luxury'
  | 'cyber-void'
  | 'plasma-dream'
  | 'cosmic-horizon'
  | 'aurora-core'
  | 'holographic-silver'
  | 'techno-bloom'
  | 'solar-neon'
  | 'sunset-orange';

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  description: string;
  colors: {
    // Base colors
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    
    // Accent colors
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    
    // UI elements
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
    
    // Gradients
    gradientFrom: string;
    gradientVia?: string;
    gradientTo: string;
    
    // Special effects
    glow: string;
    shadow: string;
  };
}

export const themes: Record<ThemeName, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Vibrant purple gradient with modern premium feel',
    colors: {
      background: '0 0% 99%',
      foreground: '240 10% 10%',
      card: '0 0% 100%',
      cardForeground: '240 10% 10%',
      primary: '280 85% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '250 60% 95%',
      secondaryForeground: '280 85% 40%',
      accent: '160 84% 39%',
      accentForeground: '0 0% 100%',
      muted: '240 10% 96%',
      mutedForeground: '240 5% 45%',
      border: '240 10% 92%',
      input: '240 10% 92%',
      ring: '280 85% 60%',
      gradientFrom: '280 85% 60%',
      gradientVia: '290 80% 55%',
      gradientTo: '320 90% 60%',
      glow: '280 85% 70%',
      shadow: '240 10% 10%',
    },
  },
  
  neomint: {
    id: 'neomint',
    name: 'NeoMint Futurism',
    description: 'Clean minimalism with mint green accents and glassmorphism',
    colors: {
      background: '180 20% 99%',
      foreground: '180 10% 10%',
      card: '180 30% 98%',
      cardForeground: '180 10% 10%',
      primary: '160 84% 39%',
      primaryForeground: '0 0% 100%',
      secondary: '160 30% 95%',
      secondaryForeground: '160 10% 20%',
      accent: '160 60% 50%',
      accentForeground: '0 0% 100%',
      muted: '160 20% 96%',
      mutedForeground: '160 10% 40%',
      border: '160 20% 88%',
      input: '160 20% 90%',
      ring: '160 84% 39%',
      gradientFrom: '160 84% 39%',
      gradientVia: '170 70% 45%',
      gradientTo: '180 60% 50%',
      glow: '160 84% 60%',
      shadow: '160 30% 30%',
    },
  },
  
  'digital-luxury': {
    id: 'digital-luxury',
    name: 'Digital Luxury',
    description: 'Dark matte base with gold highlights and refined elegance',
    colors: {
      background: '240 10% 8%',
      foreground: '45 100% 95%',
      card: '240 8% 12%',
      cardForeground: '45 100% 95%',
      primary: '45 100% 51%',
      primaryForeground: '240 10% 8%',
      secondary: '240 5% 18%',
      secondaryForeground: '45 80% 80%',
      accent: '45 90% 60%',
      accentForeground: '240 10% 8%',
      muted: '240 5% 20%',
      mutedForeground: '45 20% 60%',
      border: '240 5% 22%',
      input: '240 5% 18%',
      ring: '45 100% 51%',
      gradientFrom: '45 100% 51%',
      gradientVia: '38 100% 50%',
      gradientTo: '30 100% 48%',
      glow: '45 100% 60%',
      shadow: '45 80% 20%',
    },
  },
  
  'cyber-void': {
    id: 'cyber-void',
    name: 'Cyber Void',
    description: 'Deep blacks with electric blues and glowing cyberpunk effects',
    colors: {
      background: '220 20% 5%',
      foreground: '200 100% 95%',
      card: '220 18% 8%',
      cardForeground: '200 100% 95%',
      primary: '200 100% 50%',
      primaryForeground: '220 20% 5%',
      secondary: '220 15% 15%',
      secondaryForeground: '200 80% 80%',
      accent: '190 100% 55%',
      accentForeground: '220 20% 5%',
      muted: '220 12% 18%',
      mutedForeground: '200 30% 60%',
      border: '220 15% 20%',
      input: '220 15% 15%',
      ring: '200 100% 50%',
      gradientFrom: '200 100% 50%',
      gradientVia: '210 100% 55%',
      gradientTo: '220 100% 60%',
      glow: '200 100% 70%',
      shadow: '200 100% 30%',
    },
  },
  
  'plasma-dream': {
    id: 'plasma-dream',
    name: 'Plasma Dream',
    description: 'Radiant magenta-to-violet gradients with soft neon glows',
    colors: {
      background: '280 30% 10%',
      foreground: '300 100% 98%',
      card: '280 25% 14%',
      cardForeground: '300 100% 98%',
      primary: '320 100% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '280 20% 20%',
      secondaryForeground: '300 80% 90%',
      accent: '280 100% 65%',
      accentForeground: '0 0% 100%',
      muted: '280 15% 22%',
      mutedForeground: '300 40% 70%',
      border: '280 20% 25%',
      input: '280 20% 20%',
      ring: '320 100% 60%',
      gradientFrom: '320 100% 60%',
      gradientVia: '290 100% 65%',
      gradientTo: '260 100% 70%',
      glow: '320 100% 75%',
      shadow: '320 80% 35%',
    },
  },
  
  'cosmic-horizon': {
    id: 'cosmic-horizon',
    name: 'Cosmic Horizon',
    description: 'Deep navy with stellar gradients and cosmic sparkles',
    colors: {
      background: '230 40% 8%',
      foreground: '210 100% 95%',
      card: '230 35% 12%',
      cardForeground: '210 100% 95%',
      primary: '240 80% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '230 30% 18%',
      secondaryForeground: '210 80% 85%',
      accent: '250 90% 65%',
      accentForeground: '0 0% 100%',
      muted: '230 25% 20%',
      mutedForeground: '210 40% 65%',
      border: '230 30% 22%',
      input: '230 30% 18%',
      ring: '240 80% 60%',
      gradientFrom: '240 80% 60%',
      gradientVia: '220 70% 50%',
      gradientTo: '200 60% 45%',
      glow: '240 90% 70%',
      shadow: '240 60% 25%',
    },
  },
  
  'aurora-core': {
    id: 'aurora-core',
    name: 'Aurora Core',
    description: 'Shifting green-purple gradients with holographic depth',
    colors: {
      background: '200 25% 10%',
      foreground: '160 100% 95%',
      card: '200 20% 14%',
      cardForeground: '160 100% 95%',
      primary: '160 70% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '200 18% 20%',
      secondaryForeground: '160 70% 85%',
      accent: '280 80% 60%',
      accentForeground: '0 0% 100%',
      muted: '200 15% 22%',
      mutedForeground: '160 35% 65%',
      border: '200 18% 25%',
      input: '200 18% 20%',
      ring: '160 70% 50%',
      gradientFrom: '160 70% 50%',
      gradientVia: '220 60% 55%',
      gradientTo: '280 80% 60%',
      glow: '160 80% 65%',
      shadow: '160 50% 30%',
    },
  },
  
  'holographic-silver': {
    id: 'holographic-silver',
    name: 'Holographic Silver',
    description: 'Metallic silver tones with rainbow reflections and glass highlights',
    colors: {
      background: '210 15% 95%',
      foreground: '210 20% 15%',
      card: '210 20% 98%',
      cardForeground: '210 20% 15%',
      primary: '210 30% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '210 15% 92%',
      secondaryForeground: '210 20% 20%',
      accent: '280 60% 60%',
      accentForeground: '0 0% 100%',
      muted: '210 15% 90%',
      mutedForeground: '210 15% 45%',
      border: '210 20% 85%',
      input: '210 20% 88%',
      ring: '210 30% 50%',
      gradientFrom: '210 30% 50%',
      gradientVia: '280 60% 60%',
      gradientTo: '340 70% 65%',
      glow: '210 50% 70%',
      shadow: '210 30% 40%',
    },
  },
  
  'techno-bloom': {
    id: 'techno-bloom',
    name: 'Techno Bloom',
    description: 'Vibrant pink and teal with dynamic shapes and layered glows',
    colors: {
      background: '190 30% 12%',
      foreground: '330 100% 98%',
      card: '190 25% 16%',
      cardForeground: '330 100% 98%',
      primary: '330 100% 60%',
      primaryForeground: '0 0% 100%',
      secondary: '190 20% 22%',
      secondaryForeground: '330 80% 90%',
      accent: '180 90% 55%',
      accentForeground: '0 0% 100%',
      muted: '190 18% 24%',
      mutedForeground: '330 40% 70%',
      border: '190 20% 28%',
      input: '190 20% 22%',
      ring: '330 100% 60%',
      gradientFrom: '330 100% 60%',
      gradientVia: '300 90% 65%',
      gradientTo: '180 90% 55%',
      glow: '330 100% 75%',
      shadow: '330 80% 40%',
    },
  },
  
  'solar-neon': {
    id: 'solar-neon',
    name: 'Solar Neon',
    description: 'Warm amber and orange contrasted by electric blue accents',
    colors: {
      background: '25 35% 12%',
      foreground: '40 100% 98%',
      card: '25 30% 16%',
      cardForeground: '40 100% 98%',
      primary: '35 100% 55%',
      primaryForeground: '25 35% 12%',
      secondary: '25 25% 22%',
      secondaryForeground: '40 90% 90%',
      accent: '195 100% 50%',
      accentForeground: '0 0% 100%',
      muted: '25 20% 24%',
      mutedForeground: '40 40% 70%',
      border: '25 25% 28%',
      input: '25 25% 22%',
      ring: '35 100% 55%',
      gradientFrom: '35 100% 55%',
      gradientVia: '25 100% 50%',
      gradientTo: '195 100% 50%',
      glow: '35 100% 70%',
      shadow: '35 80% 35%',
    },
  },
  
  'sunset-orange': {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    description: 'Warm sunset orange with golden highlights',
    colors: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      primary: '24 100% 50%',
      primaryForeground: '0 0% 100%',
      secondary: '210 40% 96.1%',
      secondaryForeground: '222.2 47.4% 11.2%',
      accent: '210 40% 96.1%',
      accentForeground: '222.2 47.4% 11.2%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '24 100% 50%',
      gradientFrom: '24 100% 50%',
      gradientVia: '30 100% 48%',
      gradientTo: '38 100% 50%',
      glow: '24 100% 50%',
      shadow: '222.2 84% 4.9%',
    },
  },
};

export const getTheme = (themeName: ThemeName): ThemeConfig => {
  return themes[themeName] || themes.default;
};

export const applyTheme = (themeName: ThemeName) => {
  const theme = getTheme(themeName);
  const root = document.documentElement;
  
  // Apply CSS custom properties
  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--${cssVar}`, value);
  });
  
  // Store theme preference
  localStorage.setItem('theme-preference', themeName);
  
  // Add theme class for additional styling
  root.setAttribute('data-theme', themeName);
};

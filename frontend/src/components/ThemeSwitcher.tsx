import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { themes, ThemeName } from '@/lib/themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ThemeSwitcher: React.FC = () => {
  const { currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (themeName: ThemeName) => {
    setTheme(themeName);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-accent/10 transition-all duration-200"
          aria-label="Change theme"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-4 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl"
      >
        <div className="mb-3">
          <h3 className="font-semibold text-sm text-foreground mb-1">Visual Themes</h3>
          <p className="text-xs text-muted-foreground">
            Choose your preferred color palette and style
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {Object.values(themes).map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`
                group relative p-3 rounded-lg border-2 transition-all duration-200
                hover:scale-105 hover:shadow-lg
                ${
                  currentTheme === theme.id
                    ? 'border-primary shadow-md'
                    : 'border-border/30 hover:border-border'
                }
              `}
              aria-label={`Switch to ${theme.name} theme`}
            >
              {/* Theme preview gradient */}
              <div
                className="w-full h-12 rounded-md mb-2 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, 
                    hsl(${theme.colors.gradientFrom}), 
                    hsl(${theme.colors.gradientVia || theme.colors.gradientTo}), 
                    hsl(${theme.colors.gradientTo})
                  )`,
                }}
              >
                {/* Glow effect */}
                <div
                  className="absolute inset-0 opacity-40 blur-sm"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, 
                      hsl(${theme.colors.glow}), 
                      transparent
                    )`,
                  }}
                />
                
                {/* Check icon for selected theme */}
                {currentTheme === theme.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 rounded-full p-1">
                      <Check className="h-4 w-4 text-gray-900" />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Theme name */}
              <div className="text-xs font-medium text-foreground text-center leading-tight">
                {theme.name}
              </div>
              
              {/* Hover description */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {theme.description}
              </div>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiEffectProps {
  trigger: boolean;
  origin?: { x: number; y: number };
  particleCount?: number;
  spread?: number;
  colors?: string[];
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  trigger,
  origin = { x: 0.5, y: 0.5 },
  particleCount = 100,
  spread = 70,
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'],
}) => {
  useEffect(() => {
    if (trigger) {
      confetti({
        particleCount,
        spread,
        origin,
        colors,
        ticks: 200,
        gravity: 1,
        decay: 0.94,
        startVelocity: 30,
        shapes: ['circle', 'square'],
        scalar: 1.2,
      });
    }
  }, [trigger, origin, particleCount, spread, colors]);

  return null;
};

export const celebrationConfetti = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 9999,
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'],
  };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
};

export const sparkleEffect = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;

  confetti({
    particleCount: 30,
    spread: 60,
    origin: { x, y },
    colors: ['#FFD700', '#FFA500', '#FF69B4', '#00CED1'],
    shapes: ['star'],
    scalar: 1.5,
    gravity: 0.5,
    ticks: 100,
  });
};

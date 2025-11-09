import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, User, LayoutGrid, Heart } from 'lucide-react';
import { hapticFeedback } from '@/lib/animations';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Explore', path: '/marketplace' },
  { icon: LayoutGrid, label: 'Deals', path: '/account' },
  { icon: Heart, label: 'Social', path: '/social' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path: string) => {
    hapticFeedback('light');
    navigate(path);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-200 safe-area-inset-bottom"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              whileTap={{ scale: 0.9 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon with animation */}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-primary' : 'text-gray-400'
                  }`}
                />
              </motion.div>

              {/* Label */}
              <span
                className={`text-xs mt-1 ${
                  isActive ? 'text-primary font-semibold' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

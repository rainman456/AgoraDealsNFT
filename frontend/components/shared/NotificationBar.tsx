import { useState, useEffect } from "react";
import { X, Bell } from "lucide-react";

interface NotificationBarProps {
  type: "buyer" | "merchant";
}

export default function NotificationBar({ type }: NotificationBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    if (type === "buyer") {
      setNotifications([
        "🎉 New flight deals from United Airlines - Save up to 60%!",
        "✨ Trending: Hotel deals in Bali are now available",
        "🍽️ Restaurant week specials just dropped - Limited time!",
      ]);
    } else {
      setNotifications([
        "🎊 5 new claims on your Summer Flight Sale promotion!",
        "📈 Your Hotel Booking Promo is trending - 120 new claims today",
        "💰 Trading volume increased by 45% on your active deals",
      ]);
    }
  }, [type]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notifications.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [notifications.length]);

  if (!isVisible || notifications.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b border-primary/30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Bell className="w-5 h-5 text-primary flex-shrink-0 animate-pulse" />
          <p className="text-sm text-foreground/90 animate-fade-in">{notifications[currentIndex]}</p>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-foreground/60 hover:text-foreground transition-smooth flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

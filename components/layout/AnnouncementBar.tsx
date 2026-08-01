'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 1. Define flexible Types for local strings or API payload objects
export interface AnnouncementItem {
  id?: string | number;
  text: string;
  link?: string;
}

interface AnnouncementBarProps {
  // Accepts either an array of strings or structured objects from your DB/API
  items?: (string | AnnouncementItem)[];
}

// Default static fallback items until the backend is fully connected
const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  { id: 1, text: 'Free Delivery on All Orders Above £75' },
  { id: 2, text: 'Sign up today and get 10% off your first purchase' },
  { id: 3, text: 'New Fall Collection is live — Shop the latest shoes & bags' },
];

const subscribe = (callback: () => void) => {
  window.addEventListener('session-storage', callback);
  return () => window.removeEventListener('session-storage', callback);
};

const getSnapshot = () => {
  return sessionStorage.getItem('announcementBarDismissed') === 'true';
};

const getServerSnapshot = () => false;

export default function AnnouncementBar({ items }: AnnouncementBarProps) {
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Normalize incoming props into a structured AnnouncementItem format
  const announcements: AnnouncementItem[] = React.useMemo(() => {
    if (!items || items.length === 0) return DEFAULT_ANNOUNCEMENTS;

    return items.map((item, idx) =>
      typeof item === 'string'
        ? { id: idx, text: item }
        : { id: item.id ?? idx, text: item.text, link: item.link }
    );
  }, [items]);

  const isDismissed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  // Auto-scroll timer using dynamic announcements length
  useEffect(() => {
    if (isHovered || isDismissed || announcements.length === 0) return;

    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % announcements.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [isHovered, isDismissed, announcements.length]);

  const handleDismiss = () => {
    sessionStorage.setItem('announcementBarDismissed', 'true');
    window.dispatchEvent(new Event('session-storage'));
  };

  // Gracefully render nothing if dismissed or no active items in DB
  if (isDismissed || announcements.length === 0) {
    return null;
  }

  const currentItem = announcements[index];

  return (
    <div
      className="bg-foreground text-background relative flex h-9 w-full items-center justify-between px-4 text-xs font-medium tracking-luxury"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Centered Scrolling Announcement */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.id ?? index}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute flex items-center justify-center text-center"
          >
            {currentItem.link ? (
              <a
                href={currentItem.link}
                className="hover:underline transition-all"
              >
                {currentItem.text}
              </a>
            ) : (
              <span>{currentItem.text}</span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Close (X) Button */}
      <button
        onClick={handleDismiss}
        aria-label="Close Announcement Bar"
        className="text-background/70 hover:text-background absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-colors focus:outline-none"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}
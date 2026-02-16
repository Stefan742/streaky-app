// src/components/MedalUnlockQueue.tsx
import React, { useEffect, useState } from 'react';
import { useMedalStore } from '../store/MedalStore';
import MedalUnlockPopup from './MedalUnlockAnimation';

export default function MedalUnlockQueue() {
  const { medals, markMedalAsViewed } = useMedalStore();
  const [queue, setQueue] = useState<string[]>([]);
  const [currentMedalId, setCurrentMedalId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // 🔥 Детектирај unseen medals
  useEffect(() => {
    const unseenMedals = medals
      .filter((m) => m.unlocked && !m.viewedInVault)
      .sort((a, b) => (a.unlockedAt || 0) - (b.unlockedAt || 0)) // Sort by unlock time
      .map((m) => m.id);

    if (unseenMedals.length > 0 && queue.length === 0 && !isAnimating) {
      console.log('🎖️ Unseen medals detected:', unseenMedals);
      setQueue(unseenMedals);
    }
  }, [medals, queue.length, isAnimating]);

  // 🔥 Прикажи го првиот medal од queue
  useEffect(() => {
    if (queue.length > 0 && !currentMedalId && !isAnimating) {
      const nextMedalId = queue[0];
      console.log('🎖️ Showing medal:', nextMedalId);
      setCurrentMedalId(nextMedalId);
      setIsAnimating(true);
    }
  }, [queue, currentMedalId, isAnimating]);

  const handleClose = () => {
    if (currentMedalId) {
      console.log('✅ Closing medal popup:', currentMedalId);
      
      // Mark as viewed
      markMedalAsViewed(currentMedalId);

      // Remove from queue
      const newQueue = queue.slice(1);
      setQueue(newQueue);
      setCurrentMedalId(null);
      
      // Small delay before showing next medal
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);

      console.log('📋 Remaining medals in queue:', newQueue.length);
    }
  };

  const currentMedal = medals.find((m) => m.id === currentMedalId);

  if (!currentMedal || !currentMedalId) {
    return null;
  }

  return (
    <MedalUnlockPopup
      visible={true}
      medal={currentMedal}
      onClose={handleClose}
    />
  );
}
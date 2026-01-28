
import { useState, useEffect, useCallback } from 'react';
import { CompletedSermons } from '../types';

const PROGRESS_KEY = 'sermon_progress';

export const useProgress = (totalSermons: number) => {
  const [completed, setCompleted] = useState<CompletedSermons>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      const storedProgress = localStorage.getItem(PROGRESS_KEY);
      if (storedProgress) {
        const parsedProgress = JSON.parse(storedProgress) as CompletedSermons;
        setCompleted(parsedProgress);
      }
    } catch (error) {
      console.error("Failed to load progress from localStorage", error);
      localStorage.removeItem(PROGRESS_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(completed));
      const newProgress = totalSermons > 0 ? (completed.length / totalSermons) * 100 : 0;
      setProgress(newProgress);
    } catch (error) {
        console.error("Failed to save progress to localStorage", error);
    }
  }, [completed, totalSermons]);

  const toggleComplete = useCallback((sermonId: number) => {
    setCompleted(prev => {
      const isCompleted = prev.includes(sermonId);
      if (isCompleted) {
        return prev.filter(id => id !== sermonId);
      } else {
        return [...prev, sermonId];
      }
    });
  }, []);

  const isCompleted = useCallback((sermonId: number) => {
    return completed.includes(sermonId);
  }, [completed]);

  return { progress, completedCount: completed.length, toggleComplete, isCompleted };
};

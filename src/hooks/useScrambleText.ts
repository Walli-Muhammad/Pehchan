import { useState, useEffect } from 'react';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}|:<>?~=-[]\\;\',./`"';

/**
 * Custom React Hook for an Auto-Decoding Cypher Effect.
 * It animates automatically from 0% to 100% over the specified duration.
 */
export function useScrambleText(targetText: string, durationMs: number = 1500, delayMs: number = 300) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      
      const elapsed = time - startTime;

      // Waiting for delay to finish
      if (elapsed < delayMs) {
        // Show entirely random chars while waiting (or you can show nothing!)
        const fullyScrambled = targetText
          .split('')
          .map((char) => (char === ' ' ? ' ' : CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]))
          .join('');
        setDisplayText(fullyScrambled);
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      // Calculate progress 0 -> 1 after delay
      const activeElapsed = elapsed - delayMs;
      const rawProgress = Math.min(activeElapsed / durationMs, 1);
      
      // Use an ease-out function so the last few letters take slightly longer to resolve
      const progress = 1 - Math.pow(1 - rawProgress, 3);

      const totalChars = targetText.length;
      const lockedCount = Math.floor(progress * totalChars);

      let scrambled = '';
      for (let i = 0; i < totalChars; i++) {
        if (targetText[i] === ' ') {
          scrambled += ' ';
        } else if (i < lockedCount) {
          // Locked correct character
          scrambled += targetText[i];
        } else {
          // Still scrambling cypher character
          scrambled += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        }
      }

      setDisplayText(scrambled);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayText(targetText); // exactly guarantee final text
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetText, durationMs, delayMs]);

  return displayText;
}

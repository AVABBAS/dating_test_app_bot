/**
 * Centralized Haptic Feedback Hook
 * 
 * Provides semantic haptic feedback for Telegram Mini Apps.
 * All haptic interactions should go through this hook to ensure consistency.
 * 
 * Usage:
 *   const { selection, success, error, impact, match } = useHaptics();
 *   selection(); // Light selection feedback
 *   success();   // Success operation
 *   error();     // Error state
 *   impact('light'); // Impact with intensity
 *   match();     // Special match celebration
 */

import { useCallback } from 'react';
import { initHapticFeedback } from '../telegram';

export const useHaptics = () => {
  const haptic = typeof window !== 'undefined' && window.Telegram?.WebApp ? window.Telegram.WebApp.HapticFeedback : null;

  // Initialize haptic feedback on mount (Telegram requirement)
  useCallback(() => {
    if (haptic) {
      try {
        initHapticFeedback();
      } catch (e) {
        console.warn('Haptic initialization failed:', e);
      }
    }
  }, [haptic]);

  /**
   * Light selection feedback
   * Use for: picker changes, tab switches, toggle changes
   */
  const selection = useCallback(() => {
    if (haptic) {
      try {
        haptic.selectionChanged();
      } catch (e) {
        console.warn('Selection haptic failed:', e);
      }
    }
  }, [haptic]);

  /**
   * Success feedback
   * Use for: successful actions, completed operations, positive confirmations
   */
  const success = useCallback(() => {
    if (haptic) {
      try {
        haptic.notificationOccurred('success');
      } catch (e) {
        console.warn('Success haptic failed:', e);
      }
    }
  }, [haptic]);

  /**
   * Error feedback
   * Use for: failed actions, validation errors, rejected operations
   */
  const error = useCallback(() => {
    if (haptic) {
      try {
        haptic.notificationOccurred('error');
      } catch (e) {
        console.warn('Error haptic failed:', e);
      }
    }
  }, [haptic]);

  /**
   * Warning feedback
   * Use for: warnings, confirmations of destructive actions
   */
  const warning = useCallback(() => {
    if (haptic) {
      try {
        haptic.notificationOccurred('warning');
      } catch (e) {
        console.warn('Warning haptic failed:', e);
      }
    }
  }, [haptic]);

  /**
   * Impact feedback with intensity levels
   * Use for: physical interactions, button presses, gesture feedback
   * @param {'light'|'medium'|'heavy'} intensity
   */
  const impact = useCallback((intensity = 'medium') => {
    if (haptic) {
      try {
        haptic.impactOccurred(intensity);
      } catch (e) {
        console.warn('Impact haptic failed:', e);
      }
    }
  }, [haptic]);

  /**
   * Special match celebration feedback
   * Use for: when a match occurs (combination of impacts)
   */
  const match = useCallback(() => {
    if (haptic) {
      try {
        // Double impact for excitement
        haptic.impactOccurred('medium');
        setTimeout(() => haptic.impactOccurred('light'), 100);
        setTimeout(() => haptic.notificationOccurred('success'), 200);
      } catch (e) {
        console.warn('Match haptic failed:', e);
      }
    }
  }, [haptic]);

  /**
   * Swipe feedback based on direction
   * Use for: card swipe gestures in Discover
   * @param {'left'|'right'|'up'|null} direction
   */
  const swipe = useCallback((direction) => {
    if (!haptic || !direction) return;
    
    try {
      if (direction === 'right') {
        // Like - positive, lighter
        haptic.impactOccurred('light');
      } else if (direction === 'left') {
        // Pass - neutral, medium
        haptic.impactOccurred('medium');
      } else if (direction === 'up') {
        // Super like - strong, exciting
        haptic.impactOccurred('heavy');
      }
    } catch (e) {
      console.warn('Swipe haptic failed:', e);
    }
  }, [haptic]);

  return {
    selection,
    success,
    error,
    warning,
    impact,
    match,
    swipe,
  };
};

export default useHaptics;

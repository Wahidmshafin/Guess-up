import { useState, useEffect, useRef, useCallback } from 'react';
import type { TiltAction } from '../types';

interface UseDeviceOrientationOptions {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  haptics: boolean;
  onTiltAction?: (action: 'correct' | 'pass') => void;
}

export function useDeviceOrientation({
  enabled,
  sensitivity,
  haptics,
  onTiltAction,
}: UseDeviceOrientationOptions) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [tiltAction, setTiltAction] = useState<TiltAction>('neutral');
  const [debugAngle, setDebugAngle] = useState<{ beta: number | null; gamma: number | null }>({
    beta: null,
    gamma: null,
  });

  const isResetRef = useRef<boolean>(true);
  const onTiltActionRef = useRef(onTiltAction);
  onTiltActionRef.current = onTiltAction;

  // Thresholds based on sensitivity
  const getThreshold = useCallback(() => {
    switch (sensitivity) {
      case 'high':
        return { tilt: 22, reset: 10 };
      case 'low':
        return { tilt: 42, reset: 18 };
      case 'medium':
      default:
        return { tilt: 30, reset: 14 };
    }
  }, [sensitivity]);

  // Request iOS permission if needed
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        const granted = response === 'granted';
        setHasPermission(granted);
        return granted;
      } catch (err) {
        console.warn('Orientation permission denied/error:', err);
        setHasPermission(false);
        return false;
      }
    } else {
      // Standard Android / Desktop browser (no explicit permission needed)
      setHasPermission(true);
      return true;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      setIsSupported(true);
      // If not iOS, permission is implicitly granted
      const needsExplicitPermission = typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function';
      if (!needsExplicitPermission) {
        setHasPermission(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled || !hasPermission) {
      setTiltAction('neutral');
      return;
    }

    const { tilt: threshold, reset: resetThreshold } = getThreshold();

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta;   // -180 to 180 (front/back)
      const gamma = e.gamma; // -90 to 90 (left/right)

      if (beta === null && gamma === null) return;

      setDebugAngle({ beta, gamma });

      // Determine orientation angle (landscape vs portrait)
      const orientation =
        (screen.orientation && screen.orientation.type) ||
        (window.orientation !== undefined ? (window.orientation === 90 || window.orientation === -90 ? 'landscape' : 'portrait') : 'landscape');

      const isLandscape = typeof orientation === 'string' ? orientation.includes('landscape') : false;

      let tiltVal = 0;

      if (isLandscape) {
        // When in landscape against forehead: gamma tilt registers nod down / tilt back
        // In landscape-primary (rotated 90deg clockwise):
        // Tilting down (nod) makes gamma negative
        // Tilting up (look up) makes gamma positive
        const screenAngle = screen.orientation?.angle ?? (typeof window.orientation === 'number' ? window.orientation : 90);
        tiltVal = screenAngle === -90 || screenAngle === 270 ? -(gamma || 0) : (gamma || 0);
      } else {
        // In portrait mode against forehead: beta measures nodding
        // Standing phone upright against forehead is beta ~ 70-90°
        // Nod down decreases beta (< 50°)
        // Tilt up increases beta (> 120°)
        const rawBeta = beta || 0;
        tiltVal = rawBeta - 80; // normalized around 80 deg upright
      }

      // Check for reset back to neutral
      if (Math.abs(tiltVal) < resetThreshold) {
        isResetRef.current = true;
        setTiltAction('neutral');
        return;
      }

      // If we are ready for a new tilt action:
      if (isResetRef.current) {
        // Tilt Down -> CORRECT (Negative tilt)
        if (tiltVal < -threshold) {
          isResetRef.current = false;
          setTiltAction('correct');
          if (haptics && typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 30, 40]);
          }
          if (onTiltActionRef.current) {
            onTiltActionRef.current('correct');
          }
        }
        // Tilt Up -> PASS (Positive tilt)
        else if (tiltVal > threshold) {
          isResetRef.current = false;
          setTiltAction('pass');
          if (haptics && typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([60]);
          }
          if (onTiltActionRef.current) {
            onTiltActionRef.current('pass');
          }
        }
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [enabled, hasPermission, getThreshold, haptics]);

  return {
    isSupported,
    hasPermission,
    tiltAction,
    debugAngle,
    requestPermission,
  };
}

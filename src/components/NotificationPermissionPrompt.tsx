import { useEffect } from 'react';
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from '../lib/notifications';

const ASK_STATE_KEY = 'apps-studio-notification-ask-state';

type AskState = {
  date: string;
  loadTried?: boolean;
  gestureTried?: boolean;
};

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function getState(today: string): AskState {
  try {
    const raw = localStorage.getItem(ASK_STATE_KEY);
    if (!raw) return { date: today };
    const parsed = JSON.parse(raw) as AskState;
    return parsed.date === today ? parsed : { date: today };
  } catch {
    return { date: today };
  }
}

function setState(state: AskState) {
  try {
    localStorage.setItem(ASK_STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export default function NotificationPermissionPrompt() {
  useEffect(() => {
    if (!notificationsSupported()) return;
    if (notificationPermission() !== 'default') return;

    const today = todayKey();
    const initial = getState(today);

    let cleanupGesture: (() => void) | null = null;

    const askOnGesture = () => {
      if (notificationPermission() !== 'default') return;
      const current = getState(today);
      if (current.gestureTried) return;
      setState({ ...current, date: today, gestureTried: true });
      requestNotificationPermission();
      cleanupGesture?.();
    };

    const attachGestureFallback = () => {
      const current = getState(today);
      if (current.gestureTried || notificationPermission() !== 'default') return;
      const opts: AddEventListenerOptions = { once: true, passive: true, capture: true };
      window.addEventListener('pointerdown', askOnGesture, opts);
      window.addEventListener('touchstart', askOnGesture, opts);
      window.addEventListener('keydown', askOnGesture, { once: true, capture: true });
      cleanupGesture = () => {
        window.removeEventListener('pointerdown', askOnGesture, true);
        window.removeEventListener('touchstart', askOnGesture, true);
        window.removeEventListener('keydown', askOnGesture, true);
      };
    };

    if (initial.loadTried) {
      attachGestureFallback();
      return () => cleanupGesture?.();
    }

    setState({ ...initial, date: today, loadTried: true });
    requestNotificationPermission().finally(() => {
      if (notificationPermission() === 'default') attachGestureFallback();
    });

    return () => cleanupGesture?.();
  }, []);

  return null;
}

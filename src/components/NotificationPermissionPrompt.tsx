import { useEffect } from 'react';
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from '../lib/notifications';

/**
 * Download page only — fire the native browser permission dialog.
 * No in-page Allow card.
 */
export default function NotificationPermissionPrompt() {
  useEffect(() => {
    if (!notificationsSupported()) return;
    if (notificationPermission() !== 'default') return;
    void requestNotificationPermission();
  }, []);

  return null;
}


'use client';

import { useEffect, useRef } from 'react';
import { onSharedNotificationsUpdate } from '@/lib/firebase/firestoreClientService';
import { useToast } from "@/hooks/use-toast";
import type { Notification } from '@/types';

export function GlobalNotificationListener() {
  const { toast } = useToast();
  const lastProcessedNotificationTimestampRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSharedNotificationsUpdate(
      (allNotifications, newNotificationsBatch) => {
        // This listener is for real-time "ding" and toast for new notifications.
        // It processes notifications that were added since the listener was attached,
        // or more robustly, those newer than the last one processed.
        
        let latestTimestampInBatch = lastProcessedNotificationTimestampRef.current;

        newNotificationsBatch.forEach((notif) => {
          // Basic check to avoid re-processing if onSnapshot sends duplicates or on initial load
          // A more robust way would be to compare with a local "last seen timestamp" or IDs
          if (!lastProcessedNotificationTimestampRef.current || new Date(notif.timestamp) > new Date(lastProcessedNotificationTimestampRef.current)) {
            
            // Only toast/sound for notifications that are genuinely new since last check
            // This condition might need refinement based on how `newNotificationsBatch` is constructed
            // For now, we assume newNotificationsBatch contains truly new items for this client instance.
            if (new Date(notif.timestamp).getTime() > (Date.now() - 60000)) { // Process if within last minute
                toast({
                    title: notif.title,
                    description: notif.message,
                });
                try {
                    const audio = new Audio('/sounds/notification.mp3');
                    audio.play().catch(error => console.warn("GlobalNotificationListener: Audio play failed:", error));
                } catch (e) {
                    console.warn("GlobalNotificationListener: Audio object creation failed:", e);
                }
            }
          }
          if (!latestTimestampInBatch || new Date(notif.timestamp) > new Date(latestTimestampInBatch)) {
            latestTimestampInBatch = notif.timestamp;
          }
        });

        if (latestTimestampInBatch) {
            lastProcessedNotificationTimestampRef.current = latestTimestampInBatch;
        }

      },
      (error) => {
        console.error("GlobalNotificationListener: Error listening to shared notifications:", error);
        // Optionally, inform the user about the issue if it's critical for notifications
        // toast({ variant: "destructive", title: "Erreur Notifications", description: "Connexion aux notifications en temps réel perdue." });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [toast]);

  return null; // This component does not render anything itself
}

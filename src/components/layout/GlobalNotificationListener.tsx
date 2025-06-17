
'use client';

import { useEffect, useRef } from 'react';
import { onSharedNotificationsUpdate } from '@/lib/firebase/firestoreClientService';
import { useToast } from "@/hooks/use-toast";
import type { Notification } from '@/types';

const PROCESSED_NOTIF_IDS_SESSION_KEY = 'processedSharedNotificationIdsSodisenApp';

// Helper to get initial set from session storage
const getInitialProcessedIds = (): Set<string> => {
  if (typeof window !== 'undefined') {
    try {
      const storedIds = sessionStorage.getItem(PROCESSED_NOTIF_IDS_SESSION_KEY);
      if (storedIds) {
        const parsed = JSON.parse(storedIds);
        if (Array.isArray(parsed)) { // Ensure it's an array before creating Set
           return new Set(parsed);
        } else {
            console.warn("GlobalNotificationListener: stored processedNotificationIds is not an array, resetting.");
            sessionStorage.removeItem(PROCESSED_NOTIF_IDS_SESSION_KEY);
            return new Set();
        }
      }
    } catch (e) {
      console.error("Error parsing processedNotificationIds from sessionStorage:", e);
      // If parsing fails, clear the invalid item and return an empty set
      sessionStorage.removeItem(PROCESSED_NOTIF_IDS_SESSION_KEY);
      return new Set();
    }
  }
  return new Set();
};

export function GlobalNotificationListener() {
  const { toast } = useToast();
  // useRef to hold the set, initialized from sessionStorage to persist across component re-mounts within a session
  const processedNotificationIdsRef = useRef<Set<string>>(getInitialProcessedIds());

  useEffect(() => {
    const unsubscribe = onSharedNotificationsUpdate(
      (allNotifications, newNotificationsBatch) => { 
        
        let newIdsAddedToSessionStorage = false;
        newNotificationsBatch.forEach((notif) => {
          // Check if this notification ID has already been processed in this session
          if (!processedNotificationIdsRef.current.has(notif.id)) {
            
            const notificationDate = new Date(notif.timestamp);
            const now = new Date();
            // Only play sound/toast if notification is very recent (e.g., < 2 minutes old)
            if (now.getTime() - notificationDate.getTime() < 120000) { // 120000ms = 2 minutes
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
            // Add to processed set and mark that we need to update sessionStorage
            processedNotificationIdsRef.current.add(notif.id);
            newIdsAddedToSessionStorage = true;
          }
        });

        // If new IDs were processed, update sessionStorage
        if (newIdsAddedToSessionStorage && typeof window !== 'undefined') {
          try {
            sessionStorage.setItem(PROCESSED_NOTIF_IDS_SESSION_KEY, JSON.stringify(Array.from(processedNotificationIdsRef.current)));
          } catch (e) {
            console.error("Error saving processedNotificationIds to sessionStorage:", e);
          }
        }
      },
      (error) => {
        console.error("GlobalNotificationListener: Error listening to shared notifications:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [toast]); // toast is a stable dependency from useToast hook

  return null; // This component does not render anything itself
}


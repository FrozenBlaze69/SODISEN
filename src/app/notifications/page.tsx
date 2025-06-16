
'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types';
import { AlertTriangle, CheckCircle2, Info, Bell, Trash2, Eye, Clock, UtensilsCrossed } from 'lucide-react';

// Fixed reference date for mock data
const mockDateReference = new Date('2024-07-15T10:00:00.000Z');
const SHARED_NOTIFICATIONS_KEY = 'sharedAppNotifications';

// Mock Data for Notifications using fixed timestamps
const mockNotificationsInitial: Notification[] = [
  { id: 'mock-1', timestamp: new Date(mockDateReference.getTime() - 3600000).toISOString(), type: 'absence', title: 'Absence Imprévue (Exemple)', message: 'Paul Martin ne prendra pas son repas ce midi (Raison: RDV médical).', isRead: false, relatedResidentId: '1' },
  { id: 'mock-2', timestamp: new Date(mockDateReference.getTime() - 7200000).toISOString(), type: 'outing', title: 'Sortie Extérieure (Exemple)', message: 'Paola Leroy déjeune en famille ce midi.', isRead: true, relatedResidentId: '2' },
  { id: 'mock-3', timestamp: new Date(mockDateReference.getTime() - 10800000).toISOString(), type: 'info', title: 'Présence Confirmée (Exemple)', message: 'Tous les résidents de l\'étage A sont présents pour le déjeuner.', isRead: true },
  { id: 'mock-4', timestamp: new Date(mockDateReference.getTime() - 86400000).toISOString(), type: 'allergy_alert', title: 'Alerte Allergie Cuisine (Exemple)', message: 'Attention: Jean Dupont est allergique aux arachides. Vérifiez la préparation du plat n°3.', isRead: false, relatedResidentId: '1'},
];


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clientSideRendered, setClientSideRendered] = useState(false);

  useEffect(() => {
    setClientSideRendered(true);
    try {
      const storedNotificationsRaw = localStorage.getItem(SHARED_NOTIFICATIONS_KEY);
      let loadedNotifications: Notification[] = [];
      if (storedNotificationsRaw) {
        loadedNotifications = JSON.parse(storedNotificationsRaw);
      }
      
      if (loadedNotifications.length > 0) {
          // If shared notifications exist, use them primarily. We could merge or replace.
          // For now, let's show shared notifications. If you want to merge, uncomment next line.
          // loadedNotifications = [...loadedNotifications, ...mockNotificationsInitial.filter(mn => !loadedNotifications.find(ln => ln.id === mn.id))];
          setNotifications(loadedNotifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } else {
          // Fallback to initial mock notifications if no shared ones are found
          setNotifications(mockNotificationsInitial.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }

    } catch (error) {
      console.error("Error loading notifications from localStorage:", error);
      // Fallback to initial mock notifications in case of error
      setNotifications(mockNotificationsInitial.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  }, []);

  const updateLocalStorageNotifications = (updatedNotifications: Notification[]) => {
    if (!clientSideRendered) return; // Ensure localStorage is only accessed client-side
    try {
      localStorage.setItem(SHARED_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error("Error saving notifications to localStorage:", error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'allergy_alert':
      case 'emergency':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'urgent_diet_request':
        return <UtensilsCrossed className="h-6 w-6 text-orange-600" />;
      case 'absence': // Covers 'absent' or 'external' statuses
      case 'outing':
        return <Info className="h-6 w-6 text-yellow-500" />;
      case 'attendance_reminder':
        return <Clock className="h-6 w-6 text-blue-500" />;
      case 'info':
      case 'attendance': // Covers 'present' status change
      default:
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
    }
  };

  const handleMarkAsRead = (id: string) => {
    const newNotifications = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(newNotifications);
    updateLocalStorageNotifications(newNotifications);
  };

  const handleMarkAllAsRead = () => {
    const newNotifications = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(newNotifications);
    updateLocalStorageNotifications(newNotifications);
  };

  const handleDeleteRead = () => {
    const newNotifications = notifications.filter(n => !n.isRead);
    setNotifications(newNotifications);
    updateLocalStorageNotifications(newNotifications);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Historique des Notifications</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="font-body" onClick={handleMarkAllAsRead} disabled={notifications.every(n => n.isRead)}>
              <Eye className="mr-2 h-4 w-4"/>Marquer tout comme lu
            </Button>
            <Button variant="destructive" className="font-body" onClick={handleDeleteRead} disabled={notifications.every(n => !n.isRead) || notifications.filter(n => n.isRead).length === 0}>
              <Trash2 className="mr-2 h-4 w-4"/>Supprimer les lues
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Toutes les Notifications</CardTitle>
            <CardDescription className="font-body">
              Consultez l'historique de toutes les alertes et informations. Les nouvelles notifications apparaissent en haut.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground font-body">
                <Bell className="h-12 w-12 mx-auto mb-4" />
                <p>Aucune notification pour le moment.</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                    !notif.isRead ? 'bg-primary/5 border-primary/50' : 'bg-card'
                  }`}
                >
                  <div className="flex-shrink-0 pt-1">{getNotificationIcon(notif.type)}</div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-semibold font-body ${!notif.isRead ? 'text-primary' : ''}`}>{notif.title}</h3>
                      {clientSideRendered && (
                        <span className={`text-xs font-body ${!notif.isRead ? 'text-primary/80' : 'text-muted-foreground'}`}>
                          {new Date(notif.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      )}
                       {!clientSideRendered && <span className="text-xs font-body text-muted-foreground">Chargement...</span>}
                    </div>
                    <p className={`text-sm font-body ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notif.message}
                    </p>
                    {notif.relatedResidentId && (
                       <p className="text-xs mt-1 font-body">
                         <span className="text-muted-foreground">Résident concerné: </span>
                         <Button variant="link" className="p-0 h-auto text-xs text-primary font-body" asChild>
                            {/* This logic to find resident name needs to be adapted if mockNotificationsInitial is filtered */}
                            {/* For now, link to manage-residents. A better UX would be a modal with resident details */}
                            <a href={`/manage-residents?edit=${notif.relatedResidentId}`} target="_blank" rel="noopener noreferrer">
                                Profil (ID: {notif.relatedResidentId})
                            </a>
                         </Button>
                       </p>
                    )}
                  </div>
                  {!notif.isRead && (
                    <Button variant="ghost" size="sm" className="flex-shrink-0 text-xs font-body" onClick={() => handleMarkAsRead(notif.id)}>
                        Marquer lu
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/types';
import { AlertTriangle, CheckCircle2, Info, Bell, Trash2, Eye, Clock, UtensilsCrossed } from 'lucide-react';

// Fixed reference date for mock data
const mockDateReference = new Date('2024-07-15T10:00:00.000Z');

// Mock Data for Notifications using fixed timestamps
const mockNotificationsInitial: Notification[] = [
  { id: '1', timestamp: new Date(mockDateReference.getTime() - 3600000).toISOString(), type: 'absence', title: 'Absence Imprévue', message: 'Paul Martin ne prendra pas son repas ce midi (Raison: RDV médical).', isRead: false, relatedResidentId: '1' },
  { id: '2', timestamp: new Date(mockDateReference.getTime() - 7200000).toISOString(), type: 'outing', title: 'Sortie Extérieure', message: 'Paola Leroy déjeune en famille ce midi.', isRead: true, relatedResidentId: '2' },
  { id: '3', timestamp: new Date(mockDateReference.getTime() - 10800000).toISOString(), type: 'info', title: 'Présence Confirmée', message: 'Tous les résidents de l\'étage A sont présents pour le déjeuner.', isRead: true },
  { id: '4', timestamp: new Date(mockDateReference.getTime() - 86400000).toISOString(), type: 'allergy_alert', title: 'Alerte Allergie Cuisine', message: 'Attention: Jean Dupont est allergique aux arachides. Vérifiez la préparation du plat n°3.', isRead: false, relatedResidentId: '1'},
  { id: '7', timestamp: new Date(mockDateReference.getTime() - 1800000).toISOString(), type: 'attendance_reminder', title: 'Rappel Présence Manquante (Déjeuner)', message: 'La présence de Sophie Petit (Ch. 203C) pour le déjeuner doit être enregistrée.', isRead: false, relatedResidentId: '6'},
  { id: '8', timestamp: new Date(mockDateReference.getTime() - 900000).toISOString(), type: 'urgent_diet_request', title: 'URGENCE: Régime Spécifique', message: 'Mme. Jeanne Moreau (Ch. 105B) nécessite un repas mixé lisse pour le déjeuner (indication médicale urgente).', isRead: false, relatedResidentId: 'mock-jm'},
  { id: '5', timestamp: new Date(mockDateReference.getTime() - 172800000).toISOString(), type: 'emergency', title: 'URGENCE MÉDICALE', message: 'Chute de Mme. Petit dans la chambre 203. Intervention infirmière en cours.', isRead: true, relatedResidentId: '6' },
  { id: '6', timestamp: new Date(mockDateReference.getTime() - 259200000).toISOString(), type: 'info', title: 'Menu de la semaine publié', message: 'Le menu de la semaine prochaine est disponible pour consultation.', isRead: true },
];


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotificationsInitial.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  const [clientSideRendered, setClientSideRendered] = useState(false);

  useEffect(() => {
    setClientSideRendered(true);
  }, []);


  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'allergy_alert':
      case 'emergency':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'urgent_diet_request':
        return <UtensilsCrossed className="h-6 w-6 text-orange-600" />;
      case 'absence':
      case 'outing':
        return <Info className="h-6 w-6 text-yellow-500" />;
      case 'attendance_reminder':
        return <Clock className="h-6 w-6 text-blue-500" />;
      case 'info':
      case 'attendance':
      default:
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDeleteRead = () => {
    setNotifications(prev => prev.filter(n => !n.isRead));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Historique des Notifications</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="font-body" onClick={handleMarkAllAsRead}>
              <Eye className="mr-2 h-4 w-4"/>Marquer tout comme lu
            </Button>
            <Button variant="destructive" className="font-body" onClick={handleDeleteRead}>
              <Trash2 className="mr-2 h-4 w-4"/>Supprimer les lues
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Toutes les Notifications</CardTitle>
            <CardDescription className="font-body">
              Consultez l'historique de toutes les alertes et informations.
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
                         <Button variant="link" className="p-0 h-auto text-xs text-primary font-body">
                            {/* This logic to find resident name needs to be adapted if mockNotificationsInitial is filtered */}
                            {'Voir profil'}
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

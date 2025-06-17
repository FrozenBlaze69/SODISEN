
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Notification } from '@/types';
import { AlertTriangle, CheckCircle2, Info, Bell, Trash2, Eye, Clock, UtensilsCrossed, Send, BellPlus, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const SHARED_NOTIFICATIONS_KEY = 'sharedAppNotifications';

const customNotificationSchema = z.object({
  title: z.string().min(3, { message: "Le titre doit contenir au moins 3 caractères." }).max(100, { message: "Le titre ne peut pas dépasser 100 caractères." }),
  message: z.string().min(5, { message: "Le message doit contenir au moins 5 caractères." }).max(500, { message: "Le message ne peut pas dépasser 500 caractères." }),
});
type CustomNotificationFormValues = z.infer<typeof customNotificationSchema>;


export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clientSideRendered, setClientSideRendered] = useState(false);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const { toast } = useToast();

  const form = useForm<CustomNotificationFormValues>({
    resolver: zodResolver(customNotificationSchema),
    defaultValues: {
      title: '',
      message: '',
    },
  });

  useEffect(() => {
    setClientSideRendered(true);
    try {
      const storedNotificationsRaw = localStorage.getItem(SHARED_NOTIFICATIONS_KEY);
      let loadedNotifications: Notification[] = [];
      if (storedNotificationsRaw) {
        loadedNotifications = JSON.parse(storedNotificationsRaw);
      }
      
      // If loadedNotifications is not empty, sort and set. Otherwise, set an empty array.
      if (loadedNotifications.length > 0) {
          setNotifications(loadedNotifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } else {
          setNotifications([]); // Set to empty array if nothing in localStorage
      }

    } catch (error) {
      console.error("Error loading notifications from localStorage:", error);
      setNotifications([]); // Set to empty array on error as well
    }
  }, []);

  const updateLocalStorageNotifications = (updatedNotifications: Notification[]) => {
    if (!clientSideRendered) return; 
    try {
      localStorage.setItem(SHARED_NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error("Error saving notifications to localStorage:", error);
      toast({ variant: "destructive", title: "Erreur Locale", description: "Impossible de sauvegarder la notification localement."});
    }
  };

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
      case 'reservation_made': 
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

  const handleSendCustomNotification: SubmitHandler<CustomNotificationFormValues> = async (data) => {
    if (!clientSideRendered) {
        toast({ variant: "destructive", title: "Erreur", description: "Le composant n'est pas prêt." });
        return;
    }
    setIsSubmittingCustom(true);
    try {
      const newNotification: Notification = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: 'info', 
        title: data.title,
        message: data.message,
        isRead: false,
      };

      const updatedNotifications = [newNotification, ...notifications].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      updateLocalStorageNotifications(updatedNotifications);
      setNotifications(updatedNotifications);
      
      toast({ title: "Notification Envoyée", description: "Votre notification personnalisée a été ajoutée." });
      form.reset();
    } catch (error) {
      console.error("Error sending custom notification:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'envoyer la notification personnalisée." });
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Notifications</h1>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <BellPlus className="h-6 w-6 text-primary"/>
                    Envoyer une Notification Manuelle
                </CardTitle>
                <CardDescription className="font-body">
                    Créez une notification qui apparaîtra dans l'historique ci-dessous et sur le tableau de bord.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSendCustomNotification)} className="space-y-4 font-body">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Titre de la notification</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Rappel important" {...field} disabled={isSubmittingCustom} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message de la notification</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Ex: N'oubliez pas la réunion à 14h." {...field} disabled={isSubmittingCustom} rows={3}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmittingCustom}>
                            {isSubmittingCustom ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Envoi...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Envoyer la Notification
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex-grow">
                    <CardTitle className="font-headline">Historique des Notifications</CardTitle>
                    <CardDescription className="font-body">
                    Consultez l'historique de toutes les alertes et informations. Les nouvelles notifications apparaissent en haut.
                    </CardDescription>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" className="font-body" onClick={handleMarkAllAsRead} disabled={notifications.every(n => n.isRead) || notifications.length === 0}>
                    <Eye className="mr-2 h-4 w-4"/>Tout marquer lu
                    </Button>
                    <Button variant="destructive" className="font-body" onClick={handleDeleteRead} disabled={notifications.filter(n => n.isRead).length === 0}>
                    <Trash2 className="mr-2 h-4 w-4"/>Supprimer lues
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {notifications.length === 0 && clientSideRendered ? (
              <div className="text-center py-10 text-muted-foreground font-body">
                <Bell className="h-12 w-12 mx-auto mb-4" />
                <p>Aucune notification pour le moment.</p>
              </div>
            ) : !clientSideRendered ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 font-body text-muted-foreground">Chargement des notifications...</p>
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


'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Notification, NotificationFormData } from '@/types';
import { AlertTriangle, CheckCircle2, Info, Bell, Trash2, Eye, Clock, UtensilsCrossed, Send, BellPlus, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { addSharedNotificationToFirestore, deleteSharedNotificationFromFirestore } from '@/lib/firebase/firestoreService';
import { onSharedNotificationsUpdate } from '@/lib/firebase/firestoreClientService';

const READ_NOTIFICATIONS_LOCAL_STORAGE_KEY = 'readSharedNotificationIds';

const customNotificationSchema = z.object({
  title: z.string().min(3, { message: "Le titre doit contenir au moins 3 caractères." }).max(100, { message: "Le titre ne peut pas dépasser 100 caractères." }),
  message: z.string().min(5, { message: "Le message doit contenir au moins 5 caractères." }).max(500, { message: "Le message ne peut pas dépasser 500 caractères." }),
});
type CustomNotificationFormValues = z.infer<typeof customNotificationSchema>;


export default function NotificationsPage() {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CustomNotificationFormValues>({
    resolver: zodResolver(customNotificationSchema),
    defaultValues: {
      title: '',
      message: '',
    },
  });

  useEffect(() => {
    // Load read notification IDs from localStorage
    try {
      const storedReadIds = localStorage.getItem(READ_NOTIFICATIONS_LOCAL_STORAGE_KEY);
      if (storedReadIds) {
        setReadNotificationIds(new Set(JSON.parse(storedReadIds)));
      }
    } catch (error) {
      console.error("Error loading read notification IDs from localStorage:", error);
    }

    // Subscribe to notifications from Firestore
    setIsLoading(true);
    const unsubscribe = onSharedNotificationsUpdate(
      (updatedNotifications) => {
        setAllNotifications(updatedNotifications);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications from Firestore:", error);
        toast({ variant: "destructive", title: "Erreur de chargement", description: "Impossible de charger les notifications." });
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [toast]);

  const updateReadNotificationIdsInStorage = (newReadIds: Set<string>) => {
    try {
      localStorage.setItem(READ_NOTIFICATIONS_LOCAL_STORAGE_KEY, JSON.stringify(Array.from(newReadIds)));
    } catch (error) {
      console.error("Error saving read notification IDs to localStorage:", error);
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

  const displayedNotifications = useMemo(() => {
    return allNotifications.map(n => ({
      ...n,
      isRead: readNotificationIds.has(n.id),
    })).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allNotifications, readNotificationIds]);


  const handleMarkAsRead = (id: string) => {
    const newReadIds = new Set(readNotificationIds);
    newReadIds.add(id);
    setReadNotificationIds(newReadIds);
    updateReadNotificationIdsInStorage(newReadIds);
  };

  const handleMarkAllAsRead = () => {
    const newReadIds = new Set(allNotifications.map(n => n.id));
    setReadNotificationIds(newReadIds);
    updateReadNotificationIdsInStorage(newReadIds);
  };

  const handleDeleteRead = async () => {
    const readNotifsToDelete = allNotifications.filter(n => readNotificationIds.has(n.id));
    if (readNotifsToDelete.length === 0) {
      toast({ description: "Aucune notification lue à supprimer." });
      return;
    }
    setIsDeleting(true);
    try {
      await Promise.all(readNotifsToDelete.map(n => deleteSharedNotificationFromFirestore(n.id)));
      // Remove from local read set as well
      const remainingReadIds = new Set(readNotificationIds);
      readNotifsToDelete.forEach(n => remainingReadIds.delete(n.id));
      setReadNotificationIds(remainingReadIds);
      updateReadNotificationIdsInStorage(remainingReadIds);

      toast({ title: "Notifications lues supprimées", description: `${readNotifsToDelete.length} notification(s) ont été supprimée(s) de la base de données.` });
    } catch (error) {
      console.error("Error deleting read notifications:", error);
      toast({ variant: "destructive", title: "Erreur de suppression", description: `Impossible de supprimer les notifications. ${error instanceof Error ? error.message : ''}` });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendCustomNotification: SubmitHandler<CustomNotificationFormValues> = async (data) => {
    setIsSubmittingCustom(true);
    try {
      const newNotificationData: NotificationFormData = {
        timestamp: new Date(),
        type: 'info', 
        title: data.title,
        message: data.message,
        // isRead is handled by Firestore default / local state
        // relatedResidentId can be added if needed for custom notifications
      };

      await addSharedNotificationToFirestore(newNotificationData);
      // Toast and sound will be handled by GlobalNotificationListener
      // We can still show a local confirmation toast if desired:
      // toast({ title: "Notification envoyée", description: "Votre notification personnalisée a été envoyée." });
      form.reset();
    } catch (error) {
      console.error("Error sending custom notification:", error);
      toast({ variant: "destructive", title: "Erreur d'envoi", description: `Impossible d'envoyer la notification. ${error instanceof Error ? error.message : ''}` });
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
                    Créez une notification qui apparaîtra dans l'historique ci-dessous et sera diffusée aux utilisateurs.
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
                    <CardTitle className="font-headline">Historique des Notifications (depuis Firestore)</CardTitle>
                    <CardDescription className="font-body">
                    Consultez l'historique. L'état "Lu" est local à votre navigateur. La suppression retire de la base de données.
                    </CardDescription>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" className="font-body" onClick={handleMarkAllAsRead} disabled={displayedNotifications.every(n => n.isRead) || displayedNotifications.length === 0}>
                    <Eye className="mr-2 h-4 w-4"/>Tout marquer lu (local)
                    </Button>
                    <Button variant="destructive" className="font-body" onClick={handleDeleteRead} disabled={isDeleting || displayedNotifications.filter(n => n.isRead).length === 0}>
                     {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4"/>}
                        Supprimer lues (BDD)
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 font-body text-muted-foreground">Chargement des notifications...</p>
                </div>
            ) : displayedNotifications.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground font-body">
                <Bell className="h-12 w-12 mx-auto mb-4" />
                <p>Aucune notification pour le moment.</p>
              </div>
            ) : (
              displayedNotifications.map(notif => (
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
                        <span className={`text-xs font-body ${!notif.isRead ? 'text-primary/80' : 'text-muted-foreground'}`}>
                          {new Date(notif.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
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
                        Marquer lu (local)
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

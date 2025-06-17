
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format as formatDateFn, addDays, startOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarIcon, Send, Loader2, Users, Trash2, BellRing } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import type { MealReservationFormData, MealReservation, Notification } from '@/types';
import { handleMealReservation } from '@/app/actions';

const LOCAL_STORAGE_RESERVATIONS_KEY = 'mealReservations';
const SHARED_NOTIFICATIONS_KEY = 'sharedAppNotifications';

const reservationFormSchema = z.object({
  residentName: z.string().min(2, { message: "Le nom du résident/personne est requis (minimum 2 caractères)." }),
  mealDate: z.date({
    required_error: "La date du repas est requise.",
    invalid_type_error: "Format de date invalide.",
  }).refine(date => date >= startOfDay(new Date()), {
    message: "La date ne peut pas être dans le passé."
  }).refine(date => date <= addDays(startOfDay(new Date()), 30), {
    message: "La réservation ne peut pas excéder 30 jours à l'avance."
  }),
  mealType: z.enum(['lunch', 'dinner'], {
    required_error: "Le type de repas est requis.",
  }),
  numberOfGuests: z.coerce
    .number({invalid_type_error: "Veuillez entrer un nombre."})
    .min(0, { message: "Le nombre d'invités doit être positif ou nul (0 si seul le résident mange)." })
    .int({ message: "Le nombre d'invités doit être un nombre entier." }),
  comments: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof reservationFormSchema>;

type ServerActionReservationData = Omit<ReservationFormValues, 'mealDate'> & {
  mealDate: string;
};

export default function MealReservationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationsList, setReservationsList] = useState<MealReservation[]>([]);
  const [clientSideRendered, setClientSideRendered] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setClientSideRendered(true);
    // User request: clear the list as part of this fix.
    // This effect runs once on mount.
    try {
      localStorage.removeItem(LOCAL_STORAGE_RESERVATIONS_KEY);
      setReservationsList([]); // Ensure state is also empty
      // Optional: toast that the list was cleared, but can be removed if too noisy
      // toast({
      //   title: "Liste des réservations réinitialisée",
      //   description: "Les réservations précédemment stockées ont été effacées.",
      //   duration: 3000
      // });
    } catch (error) {
      console.error("Error clearing reservations from localStorage:", error);
      setReservationsList([]); // Fallback to empty list
    }
  }, []); // Empty dependency array ensures this runs once on mount


  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      residentName: '',
      mealDate: undefined,
      mealType: undefined,
      numberOfGuests: 0,
      comments: '',
    },
  });

  const onSubmit: SubmitHandler<ReservationFormValues> = async (clientFormData) => {
    setIsSubmitting(true);
    try {
      const serverActionData: ServerActionReservationData = {
        ...clientFormData,
        mealDate: formatDateFn(clientFormData.mealDate, 'yyyy-MM-dd'),
      };

      const result = await handleMealReservation(serverActionData);
      
      if (result.success && result.reservationDetails) {
        const newReservation = result.reservationDetails;
        
        const updatedListForStateAndStorage = [newReservation, ...reservationsList].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        if (clientSideRendered) {
            try {
                localStorage.setItem(LOCAL_STORAGE_RESERVATIONS_KEY, JSON.stringify(updatedListForStateAndStorage));
                setReservationsList(updatedListForStateAndStorage); 
                toast({
                  title: "Réservation enregistrée",
                  description: result.message,
                });

                const newNotification: Notification = {
                    id: `notif-resa-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    type: 'reservation_made', 
                    title: 'Nouvelle Réservation Repas',
                    message: `${newReservation.residentName} a une réservation pour ${newReservation.numberOfGuests} invité(s) le ${formatDateFn(parseISO(newReservation.mealDate), 'dd/MM/yyyy', { locale: fr })} (${newReservation.mealType === 'lunch' ? 'Déjeuner' : 'Dîner'}).`,
                    isRead: false,
                };
                const existingNotificationsRaw = localStorage.getItem(SHARED_NOTIFICATIONS_KEY);
                let allNotifications: Notification[] = existingNotificationsRaw ? JSON.parse(existingNotificationsRaw) : [];
                allNotifications = [newNotification, ...allNotifications];
                localStorage.setItem(SHARED_NOTIFICATIONS_KEY, JSON.stringify(allNotifications));

            } catch (error) {
                console.error("Error saving new reservation to localStorage:", error);
                // Even if localStorage fails for some reason, the server action succeeded.
                // We might have an inconsistent state if localStorage save fails here.
                // Add the reservation to the current view at least.
                setReservationsList(prevList => [newReservation, ...prevList].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                toast({
                  variant: "destructive",
                  title: "Erreur de sauvegarde locale (Réservation)",
                  description: "La réservation a été envoyée, mais n'a pas pu être sauvegardée localement. Elle pourrait ne pas persister après rafraîchissement.",
                });
            }
        } else {
            // Client not ready, this case is less likely now but good to have
            setReservationsList(prevList => [newReservation, ...prevList].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            toast({
              title: "Réservation traitée (client non prêt)",
              description: result.message,
            });
        }
        
        form.reset({
          residentName: '',
          mealDate: undefined, 
          mealType: undefined,
          numberOfGuests: 0,
          comments: '',
        });
      } else {
        toast({
          variant: "destructive",
          title: "Échec de la réservation",
          description: result.message || "Une erreur est survenue.",
        });
      }
    } catch (error) {
      console.error("Reservation submission error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue est survenue lors de la soumission.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReservation = (reservationId: string) => {
    if (!clientSideRendered) {
      toast({ variant: "destructive", title: "Erreur", description: "L'application n'est pas prête pour cette action." });
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette réservation (ID: ${reservationId}) ? Cette action est irréversible.`)) {
      const originalLength = reservationsList.length;
      const updatedReservations = reservationsList.filter(r => r.id !== reservationId);

      if (updatedReservations.length < originalLength) { // An item was actually found and removed
        try {
          localStorage.setItem(LOCAL_STORAGE_RESERVATIONS_KEY, JSON.stringify(updatedReservations));
          setReservationsList(updatedReservations); // Update state ONLY if localStorage was successful
          toast({ title: "Réservation supprimée", description: "La réservation a été retirée de la liste et sauvegardée." });
        } catch (error) {
          console.error("Erreur sauvegarde localStorage après suppression:", error);
          toast({
            variant: "destructive",
            title: "Erreur Sauvegarde Locale",
            description: "La suppression n'a pas pu être sauvegardée localement. La modification pourrait ne pas persister.",
          });
          // Do NOT update setReservationsList here, so the UI reflects the persistence failure
        }
      } else {
        // No item was removed, meaning the ID wasn't found in the current state
        toast({ variant: "default", title: "Information", description: "Réservation non trouvée ou déjà supprimée de la vue actuelle." });
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground">
          Réservation de Repas Invités
        </h1>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Nouvelle Réservation (30 jours à l'avance maximum)
            </CardTitle>
            <CardDescription className="font-body">
              Veuillez remplir le formulaire ci-dessous pour réserver des repas pour un résident et ses invités.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 font-body">
                <FormField
                  control={form.control}
                  name="residentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du Résident / Personne concernée</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mme Dupont et famille" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mealDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date du repas</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isSubmitting}
                            >
                              {field.value ? (
                                formatDateFn(field.value, "PPP", { locale: fr })
                              ) : (
                                <span>Choisir une date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < startOfDay(new Date()) || date > addDays(startOfDay(new Date()), 30)
                            }
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Vous pouvez réserver jusqu'à 30 jours à l'avance.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de repas</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir le type de repas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lunch">Déjeuner</SelectItem>
                          <SelectItem value="dinner">Dîner</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfGuests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre d'invités (en plus du résident)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={event => field.onChange(+event.target.value)} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>
                        Si seul le résident mange (pas d'invité supplémentaire), laissez à 0.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commentaires (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informations additionnelles, allergies des invités spécifiques à ce repas, etc."
                          className="resize-none"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer la réservation
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <BellRing className="h-6 w-6 text-primary"/>
                Liste des Réservations Enregistrées
            </CardTitle>
            <CardDescription className="font-body">
                Visualisez ici les réservations de repas pour les invités. La liste est réinitialisée à chaque chargement de cette page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!clientSideRendered ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 font-body text-muted-foreground">Chargement des réservations...</p>
                </div>
            ) : reservationsList.length === 0 ? (
                <p className="text-muted-foreground font-body text-center py-4">Aucune réservation enregistrée pour le moment.</p>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="font-headline">Nom</TableHead>
                                <TableHead className="font-headline">Date Repas</TableHead>
                                <TableHead className="font-headline">Type</TableHead>
                                <TableHead className="text-center font-headline">Nb. Invités</TableHead>
                                <TableHead className="font-headline">Commentaires</TableHead>
                                <TableHead className="font-headline">Réservé le</TableHead>
                                <TableHead className="text-right font-headline">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reservationsList.map(resa => (
                                <TableRow key={resa.id} className="font-body">
                                    <TableCell className="font-medium">{resa.residentName}</TableCell>
                                    <TableCell>{formatDateFn(parseISO(resa.mealDate), "dd/MM/yyyy", { locale: fr })}</TableCell>
                                    <TableCell>{resa.mealType === 'lunch' ? 'Déjeuner' : 'Dîner'}</TableCell>
                                    <TableCell className="text-center">{resa.numberOfGuests}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{resa.comments || '-'}</TableCell>
                                    <TableCell>{formatDateFn(parseISO(resa.createdAt), "dd/MM/yy HH:mm", { locale: fr })}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDeleteReservation(resa.id)} 
                                            aria-label="Supprimer la réservation"
                                            disabled={!clientSideRendered || isSubmitting} 
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
          </CardContent>
           <CardFooter>
             <p className="text-xs text-muted-foreground font-body">Les réservations sont stockées localement dans le navigateur pour la session en cours.</p>
           </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}

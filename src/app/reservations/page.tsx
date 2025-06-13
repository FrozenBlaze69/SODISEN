
'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Send, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import type { MealReservationFormData, Resident } from '@/types'; // Assurez-vous que Resident est importé
import { handleMealReservation } from '@/app/actions'; // Assurez-vous que le chemin est correct

// Schéma de validation Zod pour le formulaire de réservation
const reservationFormSchema = z.object({
  residentId: z.string().min(1, { message: "Veuillez sélectionner un résident." }),
  mealDate: z.date({
    required_error: "La date du repas est requise.",
    invalid_type_error: "Format de date invalide.",
  }).refine(date => date >= startOfDay(new Date()), {
    message: "La date ne peut pas être dans le passé."
  }).refine(date => date <= addDays(startOfDay(new Date()), 7), {
    message: "La réservation ne peut pas excéder 7 jours à l'avance."
  }),
  mealType: z.enum(['lunch', 'dinner'], {
    required_error: "Le type de repas est requis.",
  }),
  numberOfGuests: z.coerce
    .number({invalid_type_error: "Veuillez entrer un nombre."})
    .min(0, { message: "Le nombre d'invités doit être positif ou nul." })
    .int({ message: "Le nombre d'invités doit être un nombre entier." }),
  comments: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof reservationFormSchema>;

// Mock data pour les résidents (à remplacer par une récupération de données réelles)
const mockResidents: Pick<Resident, 'id' | 'firstName' | 'lastName' | 'unit'>[] = [
  { id: '1', firstName: 'Jean', lastName: 'Dupont', unit: 'Unité A' },
  { id: '2', firstName: 'Aline', lastName: 'Martin', unit: 'Unité B' },
  { id: '3', firstName: 'Pierre', lastName: 'Durand', unit: 'Unité A' },
];


export default function MealReservationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      residentId: '',
      mealDate: undefined,
      mealType: undefined,
      numberOfGuests: 0,
      comments: '',
    },
  });

  const onSubmit: SubmitHandler<ReservationFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await handleMealReservation(data);
      if (result.success) {
        toast({
          title: "Réservation enregistrée",
          description: result.message,
        });
        form.reset();
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

  return (
    <AppLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <h1 className="text-3xl font-headline font-semibold text-foreground">
          Réservation de Repas Invités
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Nouvelle Réservation (7 jours à l'avance maximum)
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
                  name="residentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Résident concerné</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un résident" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockResidents.map(resident => (
                            <SelectItem key={resident.id} value={resident.id}>
                              {resident.lastName}, {resident.firstName} ({resident.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                                format(field.value, "PPP", { locale: fr })
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
                              date < startOfDay(new Date()) || date > addDays(startOfDay(new Date()), 7)
                            }
                            initialFocus
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Vous pouvez réserver jusqu'à 7 jours à l'avance.
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
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                        Si seul le résident mange et qu'il n'y a pas d'invité supplémentaire, laissez à 0.
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
      </div>
    </AppLayout>
  );
}

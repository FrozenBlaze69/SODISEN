
'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, PlusCircle, Import } from 'lucide-react'; // Remplacement de FileImport par Import
import type { WeeklyDayPlan } from '@/types';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';


export default function MenusPage() {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyDayPlan[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedPlanJson = localStorage.getItem('currentWeeklyPlan');
    if (storedPlanJson) {
      try {
        const parsedPlan = JSON.parse(storedPlanJson);
        setWeeklyPlan(parsedPlan);
      } catch (error) {
        console.error("Failed to parse weekly plan from localStorage", error);
        setWeeklyPlan(null); // Clear if parsing fails
      }
    }
    setIsLoading(false);
  }, []);

  const formatDateForDisplay = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'd MMMM yyyy', { locale: fr });
    } catch {
      return dateString; // Fallback if date is not parsable
    }
  };
  
  const formatDayForDisplay = (dayString: string, dateString: string) => {
     try {
      return format(parseISO(dateString), 'EEEE d MMM', { locale: fr });
    } catch {
      return `${dayString} - ${dateString.substring(8,10)}/${dateString.substring(5,7)}`;
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Gestion des Menus Hebdomadaires</h1>
          <Button className="font-body" disabled>
            <PlusCircle className="mr-2 h-5 w-5" />
            Planifier un Menu (Manuel) {/* Disabled for now as it's auto from Excel */}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Planification Hebdomadaire (Importée)</CardTitle>
            <CardDescription className="font-body">
              Le planning hebdomadaire ci-dessous est automatiquement mis à jour lors de l'importation d'un fichier Excel
              via le <Link href="/" className="text-primary hover:underline">Tableau de Bord</Link>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="font-body text-muted-foreground">Chargement du planning...</p>
            ) : weeklyPlan && weeklyPlan.length > 0 ? (
              <>
                <div className="mb-4">
                  <h2 className="text-xl font-headline text-primary">
                    Semaine du {formatDateForDisplay(weeklyPlan[0].date)}
                    {weeklyPlan.length > 1 && ` au ${formatDateForDisplay(weeklyPlan[weeklyPlan.length - 1].date)}`}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {weeklyPlan.map(dayMenu => (
                    <Card key={dayMenu.date} className="shadow-sm flex flex-col">
                      <CardHeader>
                        <CardTitle className="font-headline text-lg">{formatDayForDisplay(dayMenu.dayOfWeek, dayMenu.date)}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm font-body flex-grow">
                        <div>
                          <h4 className="font-semibold">Déjeuner :</h4>
                          <p>Entrée: {dayMenu.meals.lunch.starter?.name || <span className="text-muted-foreground italic">N/A</span>}</p>
                          <p>Principal: {dayMenu.meals.lunch.main?.name || <span className="text-muted-foreground italic">N/A</span>}</p>
                          <p>Dessert: {dayMenu.meals.lunch.dessert?.name || <span className="text-muted-foreground italic">N/A</span>}</p>
                        </div>
                        <hr className="my-2"/>
                        <div>
                          <h4 className="font-semibold">Dîner :</h4>
                          <p>Entrée: {dayMenu.meals.dinner.starter?.name || <span className="text-muted-foreground italic">N/A</span>}</p>
                          <p>Principal: {dayMenu.meals.dinner.main?.name || <span className="text-muted-foreground italic">N/A</span>}</p>
                          <p>Dessert: {dayMenu.meals.dinner.dessert?.name || <span className="text-muted-foreground italic">N/A</span>}</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-auto font-body" disabled>
                          <CalendarDays className="mr-2 h-4 w-4"/> Modifier ce jour {/* Disabled for now */}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-muted-foreground font-body">
                <Import className="h-12 w-12 mx-auto mb-4" /> {/* Remplacement de FileImport par Import */}
                <p>Aucun planning hebdomadaire n'a été importé.</p>
                <p>Veuillez importer un fichier Excel depuis le <Link href="/" className="text-primary hover:underline">Tableau de Bord</Link> pour afficher le planning ici.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, PlusCircle } from 'lucide-react';
import Image from 'next/image';

// Mock Data for Menus
const mockWeeklyMenu = {
  weekStarting: '2024-07-29',
  days: [
    {
      day: 'Lundi',
      date: '2024-07-29',
      lunch: { main: 'Poulet Rôti, Purée de carottes', dessert: 'Salade de fruits' },
      dinner: { main: 'Soupe de légumes, Quiche lorraine', dessert: 'Yaourt nature' },
    },
    {
      day: 'Mardi',
      date: '2024-07-30',
      lunch: { main: 'Poisson pané, Riz pilaf', dessert: 'Compote de pommes' },
      dinner: { main: 'Hachis Parmentier', dessert: 'Fromage blanc' },
    },
    // ... other days
  ],
};


export default function MenusPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Gestion des Menus</h1>
          <Button className="font-body">
            <PlusCircle className="mr-2 h-5 w-5" />
            Planifier un Menu
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Planification Hebdomadaire</CardTitle>
            <CardDescription className="font-body">
              Ajoutez, modifiez et planifiez les menus quotidiens ou hebdomadaires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h2 className="text-xl font-headline text-primary">Semaine du {new Date(mockWeeklyMenu.weekStarting).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockWeeklyMenu.days.map(dayMenu => (
                <Card key={dayMenu.date} className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg">{dayMenu.day} - {new Date(dayMenu.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm font-body">
                    <div>
                      <h4 className="font-semibold">Déjeuner :</h4>
                      <p>{dayMenu.lunch.main}</p>
                      <p className="text-muted-foreground">Dessert: {dayMenu.lunch.dessert}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold">Dîner :</h4>
                      <p>{dayMenu.dinner.main}</p>
                      <p className="text-muted-foreground">Dessert: {dayMenu.dinner.dessert}</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2 font-body">
                      <CalendarDays className="mr-2 h-4 w-4"/> Modifier ce jour
                    </Button>
                  </CardContent>
                </Card>
              ))}
               <Card className="shadow-sm border-dashed border-2 flex flex-col items-center justify-center min-h-[200px] hover:border-primary transition-colors">
                <PlusCircle className="h-10 w-10 text-muted-foreground mb-2"/>
                <p className="font-body text-muted-foreground">Ajouter un jour</p>
              </Card>
            </div>
             <Image src="https://placehold.co/1200x400.png" alt="Placeholder planning image" width={1200} height={400} className="mt-6 rounded-lg object-cover" data-ai-hint="calendar schedule" />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

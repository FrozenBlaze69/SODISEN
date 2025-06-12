
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Notification, Resident, AttendanceRecord, Meal } from '@/types';
import { AlertTriangle, CheckCircle2, Info, Users, UtensilsCrossed, BellRing, ClipboardCheck, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { handleMenuUpload } from './actions';

// Mock Data
const today = new Date().toISOString().split('T')[0];

const mockResidents: Resident[] = [
  { id: '1', firstName: 'Jean', lastName: 'Dupont', roomNumber: '101A', dietaryRestrictions: ['Sans sel'], allergies: ['Arachides'], medicalSpecificities: 'Diabète type 2', isActive: true, avatarUrl: 'https://placehold.co/40x40.png' },
  { id: '2', firstName: 'Marie', lastName: 'Curie', roomNumber: '102B', dietaryRestrictions: ['Végétarien', 'Mixé'], allergies: [], medicalSpecificities: 'Hypertension', isActive: true, avatarUrl: 'https://placehold.co/40x40.png' },
  { id: '3', firstName: 'Pierre', lastName: 'Gagnon', roomNumber: '103C', dietaryRestrictions: ['Haché'], allergies: ['Gluten'], medicalSpecificities: '', isActive: true, avatarUrl: 'https://placehold.co/40x40.png' },
  { id: '4', firstName: 'Lucie', lastName: 'Tremblay', roomNumber: '201A', dietaryRestrictions: [], allergies: [], medicalSpecificities: '', isActive: true, avatarUrl: 'https://placehold.co/40x40.png' },
  { id: '5', firstName: 'Ahmed', lastName: 'Benali', roomNumber: '202B', dietaryRestrictions: ['Mixé', 'Sans porc'], allergies: [], medicalSpecificities: 'Difficultés de déglutition', isActive: true, avatarUrl: 'https://placehold.co/40x40.png' },
  { id: '6', firstName: 'Sophie', lastName: 'Petit', roomNumber: '203C', dietaryRestrictions: ['Diabétique'], allergies: [], medicalSpecificities: '', isActive: true, avatarUrl: 'https://placehold.co/40x40.png' },
];

const mockAttendance: AttendanceRecord[] = [
  { id: 'att1', residentId: '1', date: today, mealType: 'lunch', status: 'present' },
  { id: 'att2', residentId: '2', date: today, mealType: 'lunch', status: 'present' },
  { id: 'att3', residentId: '3', date: today, mealType: 'lunch', status: 'present' },
  { id: 'att4', residentId: '4', date: today, mealType: 'lunch', status: 'present' },
  { id: 'att5', residentId: '5', date: today, mealType: 'lunch', status: 'present' },
  { id: 'att6', residentId: '6', date: today, mealType: 'lunch', status: 'absent', notes: 'Rendez-vous coiffeur' }, 
];

const initialMockMealsToday: Meal[] = [
  { id: 's1', name: 'Velouté de Carottes au Cumin', category: 'starter', dietTags: ['Végétarien', 'Sans Sel'], allergenTags: [] },
  { id: 's2', name: 'Salade Composée du Chef', category: 'starter', dietTags: [], allergenTags: ['Gluten'] },
  { id: 'm1', name: 'Boeuf Bourguignon Traditionnel', category: 'main', dietTags: [], allergenTags: [] },
  { id: 'm2', name: 'Filet de Cabillaud Vapeur, Sauce Citronnée', category: 'main', dietTags: ['Sans Sel'], allergenTags: [] },
  { id: 'm3', name: 'Curry de Légumes aux Lentilles Corail', category: 'main', dietTags: ['Végétarien'], allergenTags: [] },
  { id: 'd1', name: 'Crème Caramel Maison', category: 'dessert', dietTags: [], allergenTags: ['Oeuf', 'Lactose'] },
  { id: 'd2', name: 'Compote de Pommes Cannelle', category: 'dessert', dietTags: ['Végétarien', 'Sans Sel'], allergenTags: [] },
];


const mockNotifications: Notification[] = [
  { id: '1', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'absence', title: 'Absence Imprévue', message: 'Sophie Petit ne prendra pas son repas ce midi (Coiffeur).', isRead: false, relatedResidentId: '6' },
  { id: '2', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'info', title: 'Menu Spécial Anniversaire', message: 'Le dessert "Crème Caramel" est pour l\'anniversaire de Jean Dupont.', isRead: true },
  { id: '3', timestamp: new Date(Date.now() - 10800000).toISOString(), type: 'allergy_alert', title: 'Allergie Arachides', message: 'Attention cuisine: Jean Dupont (Ch. 101A) est allergique aux arachides. Double-vérifier les préparations.', isRead: false, relatedResidentId: '1' },
];

type PreparationType = 'Normal' | 'Mixé' | 'Haché';

const getPreparationTypeForResident = (resident: Resident): PreparationType => {
  if (resident.dietaryRestrictions.some(r => r.toLowerCase().includes('mixé'))) return 'Mixé';
  if (resident.dietaryRestrictions.some(r => r.toLowerCase().includes('haché'))) return 'Haché';
  return 'Normal';
};

export default function DashboardPage() {
  const [mealPreparationStatus, setMealPreparationStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedMenuData, setImportedMenuData] = useState<Meal[] | null>(null);

  const mealsToDisplay = useMemo(() => {
    return importedMenuData || initialMockMealsToday;
  }, [importedMenuData]);

  const presentResidentAttendances = useMemo(() => {
    return mockAttendance.filter(a => a.mealType === 'lunch' && a.status === 'present');
  }, []);

  const presentResidents = useMemo(() => {
    return presentResidentAttendances
      .map(att => mockResidents.find(r => r.id === att.residentId))
      .filter((r): r is Resident => !!r);
  }, [presentResidentAttendances]);

  const totalResidents = mockResidents.length;
  const presentForLunchCount = presentResidents.length;
  
  const dietSpecificMeals = useMemo(() => ({
    'Sans sel': presentResidents.filter(r => r.dietaryRestrictions.includes('Sans sel')).length,
    'Végétarien': presentResidents.filter(r => r.dietaryRestrictions.includes('Végétarien')).length,
    'Mixé': presentResidents.filter(r => getPreparationTypeForResident(r) === 'Mixé').length,
    'Haché': presentResidents.filter(r => getPreparationTypeForResident(r) === 'Haché').length,
  }), [presentResidents]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'allergy_alert':
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'absence':
      case 'outing':
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };

  const handleMealStatusChange = (mealPrepKey: string, isReady: boolean) => {
    setMealPreparationStatus(prev => ({ ...prev, [mealPrepKey]: isReady }));
  };

  const categorizedMeals: Record<string, Meal[]> = useMemo(() => 
    mealsToDisplay.reduce((acc, meal) => {
      const category = meal.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(meal);
      return acc;
    }, {} as Record<string, Meal[]>), 
  [mealsToDisplay]);

  const categoryOrder: Meal['category'][] = ['starter', 'main', 'dessert', 'snack', 'drink'];
  const categoryLabels: Record<Meal['category'], string> = {
    starter: 'Entrées',
    main: 'Plats Principaux',
    dessert: 'Desserts',
    snack: 'Collations',
    drink: 'Boissons',
  };

  const mealPreparationDetails = useMemo(() => {
    const details: Record<string, Record<PreparationType, number>> = {};
    mealsToDisplay.forEach(meal => {
      details[meal.id] = { 'Normal': 0, 'Mixé': 0, 'Haché': 0 };
      presentResidents.forEach(resident => {
        const isResidentVegetarian = resident.dietaryRestrictions.includes('Végétarien');
        const isMealVegetarian = meal.dietTags?.includes('Végétarien');
        
        if (isResidentVegetarian && !isMealVegetarian && meal.category === 'main') {
          // This logic might need adjustment if specific vegetarian dishes are listed in the menu
          // For now, assume vegetarians get a dedicated vegetarian main dish if listed, otherwise skip non-veg main.
          const vegMain = mealsToDisplay.find(m => m.category === 'main' && m.dietTags?.includes('Végétarien'));
          if (vegMain && vegMain.id !== meal.id) return; 
        }
        
        // Check for allergies
        if (meal.allergenTags && meal.allergenTags.some(allergen => resident.allergies.includes(allergen))) {
            // Resident is allergic to this meal, do not count for preparation
            // This is a simplification; real system might need alternative meal logic
            return; 
        }

        // Check for dietary restrictions not covered by simple tags (e.g. "Sans porc" for a "Boeuf" dish is fine)
        // This part can get complex. For now, we assume dietTags on meals are sufficient or specific meals are chosen.
        // Example: if resident is "Sans sel" and meal is not "Sans Sel" tagged, they shouldn't get it.
        if (meal.dietTags && resident.dietaryRestrictions.some(restriction => 
            restriction.toLowerCase().includes('sans sel') && !meal.dietTags.some(tag => tag.toLowerCase().includes('sans sel')))
        ) {
            // Specific diet tag mismatch, skip
            // This logic is basic and might need refinement based on how dietTags are used.
            // It assumes if a resident needs "Sans sel", the meal *must* be tagged "Sans Sel".
             if (!meal.dietTags.includes('Sans sel') && resident.dietaryRestrictions.includes('Sans sel')) return;

        }


        const prepType = getPreparationTypeForResident(resident);
        details[meal.id][prepType]++;
      });
    });
    return details;
  }, [presentResidents, mealsToDisplay]);

  const onFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get('menuFile') as File;

    if (!file || file.size === 0) {
      toast({
        variant: "destructive",
        title: "Aucun fichier sélectionné",
        description: "Veuillez sélectionner un fichier Excel à importer.",
      });
      return;
    }
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({
            variant: "destructive",
            title: "Type de fichier invalide",
            description: "Veuillez sélectionner un fichier Excel (.xlsx ou .xls).",
        });
        return;
    }

    try {
      const result = await handleMenuUpload(formData);
      if (result.success) {
        toast({
          title: "Importation réussie",
          description: result.message,
        });
        if (result.menuData) {
          setImportedMenuData(result.menuData);
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast({
          variant: "destructive",
          title: "Échec de l'importation",
          description: result.message || "Une erreur est survenue lors de l'importation.",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Erreur d'importation",
        description: "Une erreur inattendue est survenue lors de l'importation du fichier.",
      });
    }
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-headline font-semibold text-foreground">Tableau de Bord</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline">Résidents Actifs</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-body">{totalResidents}</div>
              <p className="text-xs text-muted-foreground font-body">
                {presentForLunchCount} présents au déjeuner d'aujourd'hui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline">Repas à Préparer (Déjeuner)</CardTitle>
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-body">{presentForLunchCount}</div>
              <p className="text-xs text-muted-foreground font-body">
                {dietSpecificMeals['Sans sel']} sans sel, {dietSpecificMeals['Végétarien']} végé., {dietSpecificMeals['Mixé']} mixés, {dietSpecificMeals['Haché']} hachés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline">Notifications Récentes</CardTitle>
              <BellRing className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-body">{mockNotifications.filter(n => !n.isRead).length} Non Lues</div>
              <Link href="/notifications">
                <Button variant="link" className="p-0 h-auto text-xs font-body">Voir toutes les notifications</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-6 w-6 text-primary" />
                    <CardTitle className="font-headline">Suivi Préparation Repas (Déjeuner)</CardTitle>
                </div>
                <form onSubmit={onFileUpload} className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      name="menuFile"
                      accept=".xlsx, .xls"
                      className="font-body text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    <Button type="submit" size="sm" className="font-body">
                        <Upload className="mr-2 h-4 w-4" /> Importer
                    </Button>
                </form>
            </div>
            <CardDescription className="font-body mt-2">
              Détail des préparations pour les résidents présents. Cochez si prêt. Importez un fichier Excel pour mettre à jour le menu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryOrder.map(category => {
              const mealsInCategory = categorizedMeals[category];
              if (!mealsInCategory || mealsInCategory.length === 0) return null;
              
              const categoryHasContent = mealsInCategory.some(meal => 
                Object.values(mealPreparationDetails[meal.id] || {}).some(count => count > 0)
              );
              if (!categoryHasContent && mealsToDisplay.length > 0) return null;


              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold font-body text-primary mb-3 border-b pb-2">{categoryLabels[category]}</h3>
                  <div className="space-y-4">
                    {mealsInCategory.map(meal => {
                      const preparations = mealPreparationDetails[meal.id];
                      if (!preparations) return null; // Meal might not be in details if no one is eating it
                      
                      const hasPreparationsForThisMeal = Object.values(preparations).some(count => count > 0);
                      if (!hasPreparationsForThisMeal) return null;

                      return (
                        <div key={meal.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                          <p className="font-semibold font-body text-md mb-2">{meal.name}</p>
                          {meal.description && <p className="text-xs text-muted-foreground mb-2">{meal.description}</p>}
                          <div className="space-y-2 pl-4">
                            {(Object.keys(preparations) as PreparationType[]).map(prepType => {
                              const count = preparations[prepType];
                              if (count === 0) return null;
                              const mealPrepKey = `meal-${meal.id}-prep-${prepType}`;
                              return (
                                <div key={mealPrepKey} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id={mealPrepKey}
                                      checked={!!mealPreparationStatus[mealPrepKey]}
                                      onCheckedChange={(checked) => handleMealStatusChange(mealPrepKey, !!checked)}
                                      aria-label={`Marquer ${meal.name} (${prepType}) comme prêt`}
                                    />
                                    <Label htmlFor={mealPrepKey} className="font-body text-sm cursor-pointer">
                                      {prepType}: <span className="font-semibold">{count} portion{count > 1 ? 's' : ''}</span>
                                    </Label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {mealsToDisplay.length === 0 && (
                <p className="text-muted-foreground font-body text-center py-4">Aucun plat programmé ou importé pour ce service. Utilisez le bouton "Importer" pour charger un menu.</p>
            )}
             {(mealsToDisplay.length > 0 && !categoryOrder.some(category => categorizedMeals[category]?.some(meal => Object.values(mealPreparationDetails[meal.id] || {}).some(count => count > 0)))) && (
                 <p className="text-muted-foreground font-body text-center py-4">Le menu est chargé, mais aucun résident présent ne correspond aux critères pour ces plats (vérifiez allergies, régimes, et présences).</p>
             )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Aperçu des Présences (Déjeuner)</CardTitle>
              <CardDescription className="font-body">Liste des résidents et leur statut pour le déjeuner.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-headline">Résident</TableHead>
                    <TableHead className="font-headline">Statut</TableHead>
                    <TableHead className="font-headline">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {presentResidentAttendances.slice(0,3).map(att => {
                    const resident = mockResidents.find(r => r.id === att.residentId);
                    return (
                      <TableRow key={att.id} className="font-body">
                        <TableCell className="flex items-center gap-2">
                           <Image src={resident?.avatarUrl || "https://placehold.co/40x40.png"} alt={resident?.firstName || ""} width={24} height={24} className="rounded-full" data-ai-hint="person avatar" />
                          {resident ? `${resident.firstName} ${resident.lastName}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={att.status === 'present' ? 'default' : att.status === 'absent' ? 'destructive' : 'secondary'} className="bg-primary/20 text-primary-foreground">
                            {att.status === 'present' ? 'Présent(e)' : att.status === 'absent' ? 'Absent(e)' : 'Extérieur'}
                          </Badge>
                        </TableCell>
                        <TableCell>{att.notes || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                   {mockAttendance.filter(att => att.status === 'absent' && att.mealType === 'lunch').slice(0,1).map(att => {
                     const resident = mockResidents.find(r => r.id === att.residentId);
                     return (
                      <TableRow key={`absent-${att.id}`} className="font-body opacity-70">
                        <TableCell className="flex items-center gap-2">
                           <Image src={resident?.avatarUrl || "https://placehold.co/40x40.png"} alt={resident?.firstName || ""} width={24} height={24} className="rounded-full" data-ai-hint="person avatar" />
                          {resident ? `${resident.firstName} ${resident.lastName}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={'destructive'}>
                            Absent(e)
                          </Badge>
                        </TableCell>
                        <TableCell>{att.notes || '-'}</TableCell>
                      </TableRow>
                     );
                   })}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Link href="/attendance">
                  <Button variant="outline" className="w-full font-body">Gérer les Présences</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Notifications Récentes</CardTitle>
              <CardDescription className="font-body">Dernières alertes et informations importantes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockNotifications.slice(0, 3).map(notif => (
                <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-md border ${!notif.isRead ? 'bg-accent/10 border-accent' : 'bg-card'}`}>
                  <div className="pt-1">{getNotificationIcon(notif.type)}</div>
                  <div>
                    <p className="font-semibold font-body">{notif.title}</p>
                    <p className="text-sm text-muted-foreground font-body">{notif.message}</p>
                    <p className="text-xs text-muted-foreground/70 font-body">{new Date(notif.timestamp).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              ))}
              <div className="mt-4">
                 <Link href="/notifications">
                  <Button variant="outline" className="w-full font-body">Voir toutes les notifications</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

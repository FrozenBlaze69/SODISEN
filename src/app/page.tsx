
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Notification, Resident, AttendanceRecord, Meal } from '@/types';
import { AlertTriangle, CheckCircle2, Info, Users, UtensilsCrossed, BellRing, ClipboardCheck, Upload, Plus, Minus, Building } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { handleMenuUpload } from './actions';

const today = new Date().toISOString().split('T')[0]; 

const mockResidents: Resident[] = [
  { id: '1', firstName: 'Jean', lastName: 'Dupont', roomNumber: '101A', allergies: ['Arachides'], medicalSpecificities: 'Diabète type 2', isActive: true, avatarUrl: 'https://placehold.co/40x40.png', unit: 'Unité A', contraindications: ['Pamplemousse'], textures: ['Normal'], diets: ['Sans sel', 'Diabétique'] },
  { id: '2', firstName: 'Marie', lastName: 'Curie', roomNumber: '102B', allergies: [], medicalSpecificities: 'Hypertension', isActive: true, avatarUrl: 'https://placehold.co/40x40.png', unit: 'Unité A', contraindications: [], textures: ['Mixé lisse'], diets: ['Végétarien', 'Hyperprotéiné'] },
  { id: '3', firstName: 'Pierre', lastName: 'Gagnon', roomNumber: '103C', allergies: ['Gluten'], medicalSpecificities: '', isActive: true, avatarUrl: 'https://placehold.co/40x40.png', unit: 'Unité B', contraindications: [], textures: ['Haché fin'], diets: ['Sans porc'] },
  { id: '4', firstName: 'Lucie', lastName: 'Tremblay', roomNumber: '201A', allergies: [], medicalSpecificities: '', isActive: true, avatarUrl: 'https://placehold.co/40x40.png', unit: 'Unité A', contraindications: [], textures: ['Normal'], diets: [] },
  { id: '5', firstName: 'Ahmed', lastName: 'Benali', roomNumber: '202B', allergies: [], medicalSpecificities: 'Difficultés de déglutition', isActive: true, avatarUrl: 'https://placehold.co/40x40.png', unit: 'Unité B', contraindications: [], textures: ['Mixé morceaux'], diets: ['Sans porc'] },
  { id: '6', firstName: 'Sophie', lastName: 'Petit', roomNumber: '203C', allergies: [], medicalSpecificities: '', isActive: true, avatarUrl: 'https://placehold.co/40x40.png', unit: 'Unité B', contraindications: ['Soja'], textures: ['Normal'], diets: ['Diabétique'] },
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
  { id: 's1', name: 'Velouté de Carottes au Cumin', category: 'starter', dietTags: ['Végétarien', 'Sans Sel'], allergenTags: [], description: "Un velouté doux et parfumé." },
  { id: 's2', name: 'Salade Composée du Chef', category: 'starter', dietTags: [], allergenTags: ['Gluten'], description: "Salade fraîcheur avec croûtons." },
  { id: 'm1', name: 'Boeuf Bourguignon Traditionnel', category: 'main', dietTags: [], allergenTags: [], description: "Un classique mijoté lentement." },
  { id: 'm2', name: 'Filet de Cabillaud Vapeur, Sauce Citronnée', category: 'main', dietTags: ['Sans Sel'], allergenTags: [], description: "Poisson léger et acidulé." },
  { id: 'm3', name: 'Curry de Légumes aux Lentilles Corail', category: 'main', dietTags: ['Végétarien'], allergenTags: [], description: "Plat végétarien nutritif." },
  { id: 'd1', name: 'Crème Caramel Maison', category: 'dessert', dietTags: [], allergenTags: ['Oeuf', 'Lactose'], description: "Dessert onctueux et gourmand." },
  { id: 'd2', name: 'Compote de Pommes Cannelle', category: 'dessert', dietTags: ['Végétarien', 'Sans Sel'], allergenTags: [], description: "Compote simple et réconfortante." },
];

// Fixed reference date for mock data to avoid hydration issues
const mockDateReference = new Date('2024-07-15T10:00:00.000Z');

const mockNotifications: Notification[] = [
  { id: '1', timestamp: new Date(mockDateReference.getTime() - 3600000).toISOString(), type: 'absence', title: 'Absence Imprévue', message: 'Sophie Petit ne prendra pas son repas ce midi (Coiffeur).', isRead: false, relatedResidentId: '6' },
  { id: '2', timestamp: new Date(mockDateReference.getTime() - 7200000).toISOString(), type: 'info', title: 'Menu Spécial Anniversaire', message: 'Le dessert "Crème Caramel" est pour l\'anniversaire de Jean Dupont.', isRead: true },
  { id: '3', timestamp: new Date(mockDateReference.getTime() - 10800000).toISOString(), type: 'allergy_alert', title: 'Allergie Arachides', message: 'Attention cuisine: Jean Dupont (Ch. 101A) est allergique aux arachides.', isRead: false, relatedResidentId: '1' },
];

type PreparationType = 'Normal' | 'Mixé morceaux' | 'Mixé lisse' | 'Haché fin' | 'Haché gros';
const ALL_PREPARATION_TYPES: PreparationType[] = ['Normal', 'Mixé morceaux', 'Mixé lisse', 'Haché fin', 'Haché gros'];


const getPreparationTypeForResident = (resident: Resident): PreparationType => {
  if (!resident.textures || resident.textures.length === 0) return 'Normal';
  if (resident.textures.some(t => t.toLowerCase().includes('mixé lisse'))) return 'Mixé lisse';
  if (resident.textures.some(t => t.toLowerCase().includes('mixé morceaux'))) return 'Mixé morceaux';
  if (resident.textures.some(t => t.toLowerCase().includes('haché fin'))) return 'Haché fin';
  if (resident.textures.some(t => t.toLowerCase().includes('haché gros'))) return 'Haché gros';
  if (resident.textures.some(t => t.toLowerCase().includes('normal'))) return 'Normal';
  return 'Normal';
};

export default function DashboardPage() {
  const [mealPreparationStatus, setMealPreparationStatus] = useState<Record<string, { target: number; current: number }>>({});
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedMenuData, setImportedMenuData] = useState<Meal[] | null>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [clientSideRendered, setClientSideRendered] = useState(false);

  useEffect(() => {
    setClientSideRendered(true);
  }, []);

  const mealsToDisplay = useMemo(() => {
    return importedMenuData || initialMockMealsToday;
  }, [importedMenuData]);

  const presentResidentAttendances = useMemo(() => {
    return mockAttendance.filter(a => a.mealType === 'lunch' && a.status === 'present');
  }, []);

  const activeResidents = useMemo(() => mockResidents.filter(r => r.isActive), []);

  const residentsByUnit = useMemo(() => {
    return activeResidents.reduce((acc, resident) => {
      const unit = resident.unit || 'Non spécifiée';
      if (!acc[unit]) {
        acc[unit] = [];
      }
      acc[unit].push(resident);
      return acc;
    }, {} as Record<string, Resident[]>);
  }, [activeResidents]);
  
  const presentResidentsByUnit = useMemo(() => {
    const units: Record<string, Resident[]> = {};
    for (const unitName in residentsByUnit) {
        units[unitName] = residentsByUnit[unitName].filter(resident => 
            presentResidentAttendances.some(att => att.residentId === resident.id)
        );
    }
    return units;
  }, [residentsByUnit, presentResidentAttendances]);


  const totalResidents = activeResidents.length;
  const presentForLunchCount = presentResidentAttendances.length;

  const dietSpecificMeals = useMemo(() => {
    const presentRes = presentResidentAttendances
      .map(att => activeResidents.find(r => r.id === att.residentId))
      .filter((r): r is Resident => !!r);
    
    return {
    'Sans sel': presentRes.filter(r => r.diets.includes('Sans sel')).length,
    'Végétarien': presentRes.filter(r => r.diets.includes('Végétarien')).length,
    'Mixé': presentRes.filter(r => getPreparationTypeForResident(r).startsWith('Mixé')).length,
    'Haché': presentRes.filter(r => getPreparationTypeForResident(r).startsWith('Haché')).length,
    };
  }, [presentResidentAttendances, activeResidents]);


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

  const mealPreparationDetailsByUnit = useMemo(() => {
    const detailsByUnit: Record<string, Record<string, Record<PreparationType, number>>> = {};

    Object.keys(presentResidentsByUnit).forEach(unitName => {
      detailsByUnit[unitName] = {};
      const residentsInUnit = presentResidentsByUnit[unitName];

      mealsToDisplay.forEach(meal => {
        if (!detailsByUnit[unitName][meal.id]) {
            detailsByUnit[unitName][meal.id] = {} as Record<PreparationType, number>;
            ALL_PREPARATION_TYPES.forEach(pt => detailsByUnit[unitName][meal.id][pt] = 0);
        }
        
        residentsInUnit.forEach(resident => {
          if (meal.allergenTags?.some(allergen => resident.allergies.includes(allergen))) {
            return;
          }
          if (meal.category === 'main') {
            const isResidentVegetarian = resident.diets.includes('Végétarien');
            const isMealVegetarian = meal.dietTags?.includes('Végétarien');
            if (isResidentVegetarian && !isMealVegetarian) {
                const vegAlternativeExists = mealsToDisplay.some(m => m.category === 'main' && m.dietTags?.includes('Végétarien'));
                if (!isMealVegetarian && vegAlternativeExists) return; 
            }
            if (resident.diets.includes('Sans sel') && !meal.dietTags?.includes('Sans sel')) {
                 if (!meal.dietTags?.includes('Sans sel')) return;
            }
          }
          
          const prepType = getPreparationTypeForResident(resident);
          detailsByUnit[unitName][meal.id][prepType]++;
        });
      });
    });
    return detailsByUnit;
  }, [presentResidentsByUnit, mealsToDisplay]);

  useEffect(() => {
    setMealPreparationStatus(prevStatus => {
      const newStatusMap: Record<string, { target: number; current: number }> = {};
      Object.keys(mealPreparationDetailsByUnit).forEach(unitName => {
        Object.keys(mealPreparationDetailsByUnit[unitName]).forEach(mealId => {
          const mealDetails = mealPreparationDetailsByUnit[unitName][mealId];
          if (mealDetails) {
            (Object.keys(mealDetails) as PreparationType[]).forEach(prepType => {
              const target = mealDetails[prepType];
              if (target > 0) {
                const key = `unit-${unitName}-meal-${mealId}-prep-${prepType}`;
                const existing = prevStatus[key];
                newStatusMap[key] = {
                  target: target,
                  current: (existing && existing.target === target) ? existing.current : target,
                };
              }
            });
          }
        });
      });
      return newStatusMap;
    });
  }, [mealPreparationDetailsByUnit]);

  const handleQuantityChange = (mealPrepKey: string, delta: number) => {
    setMealPreparationStatus(prev => {
      const currentEntry = prev[mealPrepKey];
      if (!currentEntry) return prev;
      const newCurrent = Math.max(0, currentEntry.current + delta);
      return {
        ...prev,
        [mealPrepKey]: {
          ...currentEntry,
          current: newCurrent,
        },
      };
    });
  };

  const onFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get('menuFile') as File;

    if (!file || file.size === 0) {
      toast({ variant: "destructive", title: "Aucun fichier sélectionné", description: "Veuillez sélectionner un fichier Excel." });
      return;
    }
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({ variant: "destructive", title: "Type de fichier invalide", description: "Veuillez sélectionner un fichier Excel (.xlsx ou .xls)." });
        return;
    }

    try {
      const result = await handleMenuUpload(formData);
      if (result.success) {
        toast({ title: "Importation réussie", description: result.message });
        if (result.menuData) {
            setImportedMenuData(result.menuData);
            setImportedFileName(result.fileName || null);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast({ variant: "destructive", title: "Échec de l'importation", description: result.message || "Erreur importation."});
        setImportedMenuData(null); // Revenir au menu par défaut en cas d'échec
        setImportedFileName(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Erreur d'importation", description: "Erreur inattendue." });
      setImportedMenuData(null);
      setImportedFileName(null);
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
                {presentForLunchCount} présents au déjeuner
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline">Repas à Préparer (Déjeuner Global)</CardTitle>
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
                    <CardTitle className="font-headline">Préparation Repas par Unité (Déjeuner)</CardTitle>
                </div>
                <form onSubmit={onFileUpload} className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef} type="file" name="menuFile" accept=".xlsx, .xls"
                      className="font-body text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    <Button type="submit" size="sm" className="font-body"><Upload className="mr-2 h-4 w-4" /> Importer Menu Global</Button>
                </form>
            </div>
            <CardDescription className="font-body mt-2">
              {importedFileName ? (
                <>Menu du jour chargé depuis : <strong>{importedFileName}</strong>. </>
              ) : (
                <>Affichage du menu par défaut. </>
              )}
              Ajustez les quantités à préparer pour chaque unité. L'importation d'un nouveau menu via Excel mettra à jour les plats ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.keys(presentResidentsByUnit).sort().map(unitName => {
              const unitMealDetails = mealPreparationDetailsByUnit[unitName];
              if (!unitMealDetails || presentResidentsByUnit[unitName].length === 0) return null;

              return (
                <div key={unitName} className="border p-4 rounded-lg shadow-sm bg-card">
                  <h2 className="text-xl font-headline text-primary mb-3 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {unitName} 
                    <span className="text-sm font-body text-muted-foreground">({presentResidentsByUnit[unitName].length} résidents présents)</span>
                  </h2>
                  {categoryOrder.map(category => {
                    const mealsInCategory = categorizedMeals[category];
                    if (!mealsInCategory || mealsInCategory.length === 0) return null;

                    const categoryHasContentForUnit = mealsInCategory.some(meal => 
                        unitMealDetails[meal.id] && Object.values(unitMealDetails[meal.id]).some(count => count > 0)
                    );
                    if (!categoryHasContentForUnit && mealsToDisplay.length > 0) return null;

                    return (
                      <div key={`${unitName}-${category}`} className="mb-4 last:mb-0">
                        <h3 className="text-md font-semibold font-body text-foreground mb-2 border-b pb-1">{categoryLabels[category]}</h3>
                        <div className="space-y-3">
                          {mealsInCategory.map(meal => {
                            const preparations = unitMealDetails[meal.id];
                            if (!preparations) return null;

                            const hasPreparationsForThisMealInUnit = Object.values(preparations).some(count => count > 0);
                            if (!hasPreparationsForThisMealInUnit) return null;
                            
                            return (
                              <div key={`${unitName}-${meal.id}`} className="p-2.5 rounded-md border bg-background hover:bg-muted/30 transition-colors">
                                <p className="font-semibold font-body text-base mb-1.5">{meal.name}</p>
                                {meal.description && <p className="text-xs text-muted-foreground mb-1.5">{meal.description}</p>}
                                <div className="space-y-1.5 pl-1">
                                  {(Object.keys(preparations) as PreparationType[]).map(prepType => {
                                    const targetCount = preparations[prepType];
                                    if (targetCount === 0) return null;
                                    
                                    const mealPrepKey = `unit-${unitName}-meal-${meal.id}-prep-${prepType}`;
                                    const currentQuantity = mealPreparationStatus[mealPrepKey]?.current ?? targetCount;
                                    
                                    return (
                                      <div key={mealPrepKey} className="flex items-center justify-between py-0.5">
                                        <p className="font-body text-sm">
                                          {prepType}: <span className="text-xs text-muted-foreground">(Prévu: {targetCount})</span>
                                        </p>
                                        <div className="flex items-center gap-1">
                                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(mealPrepKey, -1)} disabled={currentQuantity === 0} aria-label={`Diminuer ${meal.name} ${prepType} pour ${unitName}`}>
                                            <Minus className="h-3.5 w-3.5" />
                                          </Button>
                                          <span className="font-body font-semibold text-center w-8 text-sm tabular-nums">
                                            {currentQuantity}
                                          </span>
                                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(mealPrepKey, 1)} aria-label={`Augmenter ${meal.name} ${prepType} pour ${unitName}`}>
                                            <Plus className="h-3.5 w-3.5" />
                                          </Button>
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
                </div>
              );
            })}
            {mealsToDisplay.length === 0 && (
                <p className="text-muted-foreground font-body text-center py-4">Aucun menu global chargé. Utilisez le bouton "Importer Menu Global".</p>
            )}
            {(mealsToDisplay.length > 0 && Object.keys(presentResidentsByUnit).every(unit => presentResidentsByUnit[unit].length === 0 || !categoryOrder.some(category => categorizedMeals[category]?.some(meal => mealPreparationDetailsByUnit[unit]?.[meal.id] && Object.values(mealPreparationDetailsByUnit[unit][meal.id]).some(count => count > 0))))) && (
                 <p className="text-muted-foreground font-body text-center py-4">Menu chargé, mais aucun résident présent ou plat applicable pour les unités (vérifiez présences, allergies, régimes, textures).</p>
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
                    <TableHead className="font-headline">Unité</TableHead>
                    <TableHead className="font-headline">Statut</TableHead>
                    <TableHead className="font-headline">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAttendance.filter(att => att.mealType === 'lunch').slice(0,4).map(att => {
                    const resident = activeResidents.find(r => r.id === att.residentId);
                    return (
                      <TableRow key={att.id} className="font-body">
                        <TableCell className="flex items-center gap-2">
                           <Image src={resident?.avatarUrl || "https://placehold.co/40x40.png"} alt={resident?.firstName || ""} width={24} height={24} className="rounded-full" data-ai-hint="person avatar" />
                          {resident ? `${resident.firstName} ${resident.lastName}` : 'N/A'}
                        </TableCell>
                        <TableCell>{resident?.unit || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={att.status === 'present' ? 'default' : att.status === 'absent' ? 'destructive' : 'secondary'} className={att.status === 'present' ? 'bg-primary/20 text-primary-foreground' : ''}>
                            {att.status === 'present' ? 'Présent(e)' : att.status === 'absent' ? 'Absent(e)' : 'Extérieur'}
                          </Badge>
                        </TableCell>
                        <TableCell>{att.notes || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Link href="/attendance"><Button variant="outline" className="w-full font-body">Gérer les Présences</Button></Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Notifications Récentes</CardTitle>
              <CardDescription className="font-body">Dernières alertes et informations importantes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {clientSideRendered && mockNotifications.slice(0, 3).map(notif => (
                <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-md border ${!notif.isRead ? 'bg-accent/10 border-accent' : 'bg-card'}`}>
                  <div className="pt-1">{getNotificationIcon(notif.type)}</div>
                  <div>
                    <p className="font-semibold font-body">{notif.title}</p>
                    <p className="text-sm text-muted-foreground font-body">{notif.message}</p>
                    <p className="text-xs text-muted-foreground/70 font-body">{new Date(notif.timestamp).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              ))}
              {!clientSideRendered && Array.from({length: 3}).map((_, i) => <div key={i} className="h-16 bg-muted rounded-md animate-pulse"></div>)}
              <div className="mt-4">
                 <Link href="/notifications"><Button variant="outline" className="w-full font-body">Voir toutes les notifications</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

    
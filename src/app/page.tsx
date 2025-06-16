
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Notification, Resident, AttendanceRecord, Meal, WeeklyDayPlan, PlannedMealItem, MealType } from '@/types';
import { AlertTriangle, CheckCircle2, Info, Users, UtensilsCrossed, BellRing, ClipboardCheck, Upload, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { handleMenuUpload } from './actions';
import { format, parseISO, isToday } from 'date-fns';
import { onResidentsUpdate } from '@/lib/firebase/firestoreClientService';


export const todayISO = new Date().toISOString().split('T')[0]; 
const LOCAL_STORAGE_ATTENDANCE_KEY_PREFIX = 'simulatedDailyAttendance_';
const SHARED_NOTIFICATIONS_KEY = 'sharedAppNotifications'; 
const LOCAL_STORAGE_WEEKLY_PLAN_FILE_NAME_KEY = 'currentWeeklyPlanFileName';

const LUNCH_HOUR_THRESHOLD = 14; // Switch to dinner view at 2 PM

export const mockAttendanceFallback: AttendanceRecord[] = [
  { id: 'att_fb_1_lunch', residentId: 'residentId1_from_firestore', date: todayISO, mealType: 'lunch', status: 'present', mealLocation: 'dining_hall' },
  { id: 'att_fb_2_lunch', residentId: 'residentId2_from_firestore', date: todayISO, mealType: 'lunch', status: 'present', mealLocation: 'room' },
  { id: 'att_fb_3_lunch', residentId: 'residentId3_from_firestore', date: todayISO, mealType: 'lunch', status: 'absent', notes: 'Rendez-vous coiffeur', mealLocation: 'not_applicable' },
  { id: 'att_fb_1_dinner', residentId: 'residentId1_from_firestore', date: todayISO, mealType: 'dinner', status: 'present', mealLocation: 'dining_hall' },
];


const initialMockMealsTodayForLunchDashboard: Meal[] = [
  { id: 'fallback-s1-lunch', name: 'Velouté de Carottes (Défaut Déj.)', category: 'starter', dietTags: ['Végétarien', 'Sans Sel'], allergenTags: [], description: "Un velouté doux et parfumé." },
  { id: 'fallback-m1-lunch', name: 'Boeuf Bourguignon (Défaut Déj.)', category: 'main', dietTags: [], allergenTags: [], description: "Un classique mijoté lentement." },
  { id: 'fallback-d1-lunch', name: 'Crème Caramel (Défaut Déj.)', category: 'dessert', dietTags: [], allergenTags: ['Oeuf', 'Lactose'], description: "Dessert onctueux et gourmand." },
];

const initialMockMealsTodayForDinnerDashboard: Meal[] = [
  { id: 'fallback-s1-dinner', name: 'Soupe de Légumes (Défaut Dîn.)', category: 'starter', dietTags: ['Végétarien'], allergenTags: [], description: "Une soupe réconfortante." },
  { id: 'fallback-m1-dinner', name: 'Poisson en Papillote (Défaut Dîn.)', category: 'main', dietTags: ['Pauvre en graisse'], allergenTags: [], description: "Léger et savoureux." },
  { id: 'fallback-d1-dinner', name: 'Salade de Fruits (Défaut Dîn.)', category: 'dessert', dietTags: [], allergenTags: [], description: "Fraîche et de saison." },
];


const mockDateReference = new Date('2024-07-15T10:00:00.000Z');

const initialMockNotificationsForDashboard: Notification[] = [
  { id: 'dash-mock-1', timestamp: new Date(mockDateReference.getTime() - 3600000).toISOString(), type: 'absence', title: 'Absence Imprévue (Exemple)', message: 'Sophie Petit ne prendra pas son repas ce midi (Coiffeur).', isRead: false, relatedResidentId: '6' },
  { id: 'dash-mock-2', timestamp: new Date(mockDateReference.getTime() - 7200000).toISOString(), type: 'info', title: 'Menu Spécial Anniversaire (Exemple)', message: 'Le dessert "Crème Caramel" est pour l\'anniversaire de Jean Dupont.', isRead: true },
  { id: 'dash-mock-3', timestamp: new Date(mockDateReference.getTime() - 10800000).toISOString(), type: 'allergy_alert', title: 'Allergie Arachides (Exemple)', message: 'Attention cuisine: Jean Dupont (Ch. 101A) est allergique aux arachides.', isRead: false, relatedResidentId: '1' },
];

type PreparationType = 'Normal' | 'Mixé morceaux' | 'Mixé lisse' | 'Haché fin' | 'Haché gros';
const ALL_PREPARATION_TYPES: PreparationType[] = ['Normal', 'Mixé morceaux', 'Mixé lisse', 'Haché fin', 'Haché gros'];


const getPreparationTypeForResident = (resident?: Resident): PreparationType => {
  if (!resident || !resident.textures || resident.textures.length === 0) return 'Normal';
  const lowerTextures = resident.textures.map(t => t.toLowerCase());
  if (lowerTextures.some(t => t.includes('mixé lisse'))) return 'Mixé lisse';
  if (lowerTextures.some(t => t.includes('mixé morceaux'))) return 'Mixé morceaux';
  if (lowerTextures.some(t => t.includes('haché fin'))) return 'Haché fin';
  if (lowerTextures.some(t => t.includes('haché gros'))) return 'Haché gros';
  if (lowerTextures.some(t => t.includes('normal'))) return 'Normal';
  return 'Normal';
};

const plannedItemToMeal = (item: PlannedMealItem, mealType: MealType): Meal => ({
  id: `planned-${item.name.replace(/\s+/g, '-').toLowerCase()}-${mealType}-${item.category}`,
  name: item.name,
  category: item.category,
  dietTags: item.dietTags || [],
  allergenTags: item.allergenTags || [],
  description: item.description,
});


export default function DashboardPage() {
  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [isLoadingResidents, setIsLoadingResidents] = useState(true);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [importedWeeklyPlan, setImportedWeeklyPlan] = useState<WeeklyDayPlan[] | null>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [clientSideRendered, setClientSideRendered] = useState(false);
  const [dailyAttendanceRecords, setDailyAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dashboardNotifications, setDashboardNotifications] = useState<Notification[]>(initialMockNotificationsForDashboard);
  const [currentMealFocus, setCurrentMealFocus] = useState<MealType>('lunch');
  const [currentTime, setCurrentTime] = useState<string | null>(null);


  useEffect(() => {
    const updateCurrentTimeAndFocus = () => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit'}));
        const currentHour = now.getHours();
        setCurrentMealFocus(currentHour < LUNCH_HOUR_THRESHOLD ? 'lunch' : 'dinner');
    };
    updateCurrentTimeAndFocus(); // Initial call
    const timerId = setInterval(updateCurrentTimeAndFocus, 60000); // Update every minute

    return () => clearInterval(timerId);
  }, []);


  const currentAttendanceKey = `${LOCAL_STORAGE_ATTENDANCE_KEY_PREFIX}${todayISO}`;

  useEffect(() => {
    setClientSideRendered(true);
    const storedPlan = localStorage.getItem('currentWeeklyPlan');
    if (storedPlan) {
      try {
        const parsedPlan = JSON.parse(storedPlan);
        setImportedWeeklyPlan(parsedPlan);
        const storedFileName = localStorage.getItem(LOCAL_STORAGE_WEEKLY_PLAN_FILE_NAME_KEY);
        if(storedFileName) setImportedFileName(storedFileName);
      } catch (e) {
        console.error("Error parsing stored weekly plan:", e);
        localStorage.removeItem('currentWeeklyPlan');
        localStorage.removeItem(LOCAL_STORAGE_WEEKLY_PLAN_FILE_NAME_KEY);
      }
    }

    try {
      const storedAttendance = localStorage.getItem(currentAttendanceKey);
      if (storedAttendance) {
        setDailyAttendanceRecords(JSON.parse(storedAttendance) as AttendanceRecord[]);
      } else {
        setDailyAttendanceRecords(mockAttendanceFallback); 
      }
    } catch (e) {
      console.error("Error reading daily attendance from localStorage for dashboard", e);
      setDailyAttendanceRecords(mockAttendanceFallback); 
    }

    try {
        const storedNotificationsRaw = localStorage.getItem(SHARED_NOTIFICATIONS_KEY);
        if (storedNotificationsRaw) {
            const loadedNotifications: Notification[] = JSON.parse(storedNotificationsRaw);
            if (loadedNotifications.length > 0) {
                 setDashboardNotifications(loadedNotifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            } else {
                 setDashboardNotifications(initialMockNotificationsForDashboard.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            }
        } else {
            setDashboardNotifications(initialMockNotificationsForDashboard.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        }
    } catch (error) {
        console.error("Error loading notifications from localStorage for dashboard:", error);
        setDashboardNotifications(initialMockNotificationsForDashboard.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }


    setIsLoadingResidents(true);
    const unsubscribe = onResidentsUpdate((updatedResidents) => {
      setAllResidents(updatedResidents);
      setIsLoadingResidents(false);
    }, (error) => {
        console.error("Failed to subscribe to residents update:", error);
        toast({
            title: "Erreur de connexion Firestore",
            description: "Impossible de charger les données des résidents. Vérifiez la configuration Firebase et les règles de sécurité.",
            variant: "destructive",
            duration: 10000,
        });
        setAllResidents([]); 
        setIsLoadingResidents(false);
    });
    return () => unsubscribe();

  }, [currentAttendanceKey, toast]); 

  const activeResidents = useMemo(() => allResidents.filter(r => r.isActive), [allResidents]);

  const mealsForFocusedMeal = useMemo(() => {
    const defaultMeals = currentMealFocus === 'lunch' ? initialMockMealsTodayForLunchDashboard : initialMockMealsTodayForDinnerDashboard;
    if (!importedWeeklyPlan) return defaultMeals;
    
    const todayPlan = importedWeeklyPlan.find(dayPlan => isToday(parseISO(dayPlan.date)));
    if (!todayPlan) return defaultMeals;

    const mealData = currentMealFocus === 'lunch' ? todayPlan.meals.lunch : todayPlan.meals.dinner;
    const todaysFocusedMeals: Meal[] = [];
    if (mealData.starter) todaysFocusedMeals.push(plannedItemToMeal(mealData.starter, currentMealFocus));
    if (mealData.main) todaysFocusedMeals.push(plannedItemToMeal(mealData.main, currentMealFocus));
    if (mealData.dessert) todaysFocusedMeals.push(plannedItemToMeal(mealData.dessert, currentMealFocus));
    
    return todaysFocusedMeals.length > 0 ? todaysFocusedMeals : defaultMeals;
  }, [importedWeeklyPlan, currentMealFocus]);
  
  const isDisplayingImportedMenuForFocusedMeal = useMemo(() => {
    if (!importedWeeklyPlan) return false;
    const todayPlan = importedWeeklyPlan.find(dayPlan => isToday(parseISO(dayPlan.date)));
    if (!todayPlan) return false;
    const mealData = currentMealFocus === 'lunch' ? todayPlan.meals.lunch : todayPlan.meals.dinner;
    return !!(mealData.starter || mealData.main || mealData.dessert);
  }, [importedWeeklyPlan, currentMealFocus]);

  const presentAttendancesForFocusedMeal = useMemo(() => {
    return dailyAttendanceRecords.filter(a => 
      a.mealType === currentMealFocus && 
      a.status === 'present' && 
      a.date === todayISO &&
      activeResidents.some(ar => ar.id === a.residentId) 
    );
  }, [activeResidents, dailyAttendanceRecords, currentMealFocus]);

  const totalActiveResidentsCount = activeResidents.length;
  const presentForFocusedMealCount = presentAttendancesForFocusedMeal.length;

  const dietSpecificMealsForFocusedMeal = useMemo(() => {
    const presentRes = presentAttendancesForFocusedMeal
      .map(att => activeResidents.find(r => r.id === att.residentId))
      .filter((r): r is Resident => !!r);
    
    return {
    'Sans sel': presentRes.filter(r => r.diets.includes('Sans sel')).length,
    'Végétarien': presentRes.filter(r => r.diets.includes('Végétarien')).length,
    'Mixé': presentRes.filter(r => getPreparationTypeForResident(r).startsWith('Mixé')).length,
    'Haché': presentRes.filter(r => getPreparationTypeForResident(r).startsWith('Haché')).length,
    };
  }, [presentAttendancesForFocusedMeal, activeResidents]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'allergy_alert':
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'absence':
      case 'outing':
        return <Info className="h-5 w-5 text-yellow-500" />;
      case 'urgent_diet_request':
        return <UtensilsCrossed className="h-5 w-5 text-orange-600" />;
      case 'attendance':
      case 'info':
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };
  

  const globalTextureCountsForFocusedMeal = useMemo(() => {
    const counts: Record<PreparationType, number> = {
      'Normal': 0,
      'Mixé morceaux': 0,
      'Mixé lisse': 0,
      'Haché fin': 0,
      'Haché gros': 0,
    };
    presentAttendancesForFocusedMeal.forEach(att => {
        const resident = activeResidents.find(r => r.id === att.residentId);
        if (resident) {
            const prepType = getPreparationTypeForResident(resident);
            counts[prepType]++;
        }
    });
    return counts;
  }, [presentAttendancesForFocusedMeal, activeResidents]);


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
      if (result.success && result.menuData) {
        toast({ title: "Importation du planning réussie", description: result.message });
        setImportedWeeklyPlan(result.menuData as WeeklyDayPlan[]);
        setImportedFileName(result.fileName || null);
        localStorage.setItem('currentWeeklyPlan', JSON.stringify(result.menuData));
        if(result.fileName) localStorage.setItem(LOCAL_STORAGE_WEEKLY_PLAN_FILE_NAME_KEY, result.fileName); 
        else localStorage.removeItem(LOCAL_STORAGE_WEEKLY_PLAN_FILE_NAME_KEY);

        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast({ variant: "destructive", title: "Échec de l'importation", description: result.message || "Erreur importation."});
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({ variant: "destructive", title: "Erreur d'importation", description: "Erreur inattendue." });
    }
  };

  const clearImportedPlan = () => {
    setImportedWeeklyPlan(null);
    setImportedFileName(null);
    localStorage.removeItem('currentWeeklyPlan');
    localStorage.removeItem(LOCAL_STORAGE_WEEKLY_PLAN_FILE_NAME_KEY);
    toast({title: "Planning importé effacé", description: "Affichage du menu par défaut."});
  }

  const unreadNotificationsCount = useMemo(() => {
    return dashboardNotifications.filter(n => !n.isRead).length;
  }, [dashboardNotifications]);


  const focusedMealText = currentMealFocus === 'lunch' ? 'Déjeuner' : 'Dîner';

  if (isLoadingResidents && !clientSideRendered) { 
    return (
      <AppLayout>
        <div className="flex h-[calc(100vh-var(--header-height)-2rem)] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-3 font-body text-lg text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-headline font-semibold text-foreground">Tableau de Bord</h1>
            {clientSideRendered && currentTime && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                    <Clock className="h-4 w-4"/> 
                    <span>{currentTime} - Vue actuelle: <span className="font-semibold text-primary">{focusedMealText}</span></span>
                </div>
            )}
        </div>


        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline">Total Résidents Actifs</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingResidents ? <Loader2 className="h-6 w-6 animate-spin text-primary my-1" /> : <div className="text-2xl font-bold font-body">{totalActiveResidentsCount}</div>}
              <p className="text-xs text-muted-foreground font-body">
                {isLoadingResidents ? "Chargement..." : `${presentForFocusedMealCount} présents au ${focusedMealText.toLowerCase()} aujourd'hui`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline">Repas à Préparer ({focusedMealText})</CardTitle>
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            {isLoadingResidents ? <Loader2 className="h-6 w-6 animate-spin text-primary my-1" /> : <div className="text-2xl font-bold font-body">{presentForFocusedMealCount}</div>}
              <p className="text-xs text-muted-foreground font-body">
                {isLoadingResidents ? "Calcul en cours..." : `Basé sur les résidents présents. ${dietSpecificMealsForFocusedMeal['Sans sel']} sans sel, ${dietSpecificMealsForFocusedMeal['Végétarien']} végé., ${dietSpecificMealsForFocusedMeal['Mixé']} mixés, ${dietSpecificMealsForFocusedMeal['Haché']} hachés.`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline">Notifications Récentes</CardTitle>
              <BellRing className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-body">{unreadNotificationsCount} Non Lues</div>
              <Link href="/notifications">
                <Button variant="link" className="p-0 h-auto text-xs font-body">Voir toutes les notifications</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-6 w-6 text-primary" />
                      <CardTitle className="font-headline">Total Textures à Préparer ({focusedMealText})</CardTitle>
                  </div>
                  <form onSubmit={onFileUpload} className="flex items-center gap-2">
                      <Input
                        ref={fileInputRef} type="file" name="menuFile" accept=".xlsx, .xls"
                        className="font-body text-sm file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      <Button type="submit" size="sm" className="font-body"><Upload className="mr-2 h-4 w-4" /> Importer Planning Semaine</Button>
                  </form>
              </div>
              <CardDescription className="font-body mt-2">
                Ce récapitulatif des textures est basé sur les résidents marqués comme présents pour le {focusedMealText.toLowerCase()}.
                {importedFileName ? ( // An Excel file has been imported
                  isDisplayingImportedMenuForFocusedMeal ? ( // And the meals for today's focus ARE from this Excel
                    <> Les plats listés ci-dessous pour le {focusedMealText.toLowerCase()} proviennent de votre fichier Excel importé : <strong>{importedFileName}</strong>.</>
                  ) : ( // Excel is imported, BUT meals for today's focus are NOT from it (using defaults)
                    (() => {
                      const todayPlan = importedWeeklyPlan!.find(dayPlan => isToday(parseISO(dayPlan.date))); // importedWeeklyPlan is guaranteed by importedFileName
                      if (todayPlan) {
                        // Excel has an entry for today, but it's empty for the current meal focus
                        return <> Le planning Excel (<strong>{importedFileName}</strong>) est chargé. Cependant, il ne contient pas de plats spécifiés pour le {focusedMealText.toLowerCase()} d'aujourd'hui dans ce fichier (vérifiez 'TypeRepas' et 'RolePlat'). Les plats affichés ci-dessous sont donc les plats par défaut.</>;
                      } else {
                        // Excel is loaded, but no entry at all for today's date
                        return <> Le planning Excel (<strong>{importedFileName}</strong>) est chargé, mais aucun menu n'y est défini pour la date d'aujourd'hui. Les plats affichés ci-dessous sont donc les plats par défaut.</>;
                      }
                    })()
                  )
                ) : ( // No Excel file has been imported
                  <> Aucun planning Excel n'a été importé. Les plats affichés ci-dessous sont les plats par défaut. Un fichier Excel peut contenir les menus du déjeuner et du dîner.</>
                )}
                {importedFileName && <Button variant="link" size="sm" className="p-0 h-auto text-xs ml-1" onClick={clearImportedPlan}>Effacer le planning importé</Button>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingResidents ? (
                  <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-2 font-body text-muted-foreground">Chargement des données de préparation...</p>
                  </div>
              ) : presentForFocusedMealCount > 0 ? (
                  <>
                      {ALL_PREPARATION_TYPES.map(prepType => {
                          const count = globalTextureCountsForFocusedMeal[prepType];
                          if (count === 0) return null; 

                          return (
                              <div key={prepType} className="py-3 px-4 rounded-lg border mb-3 bg-background shadow-sm last:mb-0">
                                  <div className="flex items-center justify-between mb-2">
                                      <p className="font-body text-lg font-semibold text-primary">{prepType}</p>
                                      <Badge variant="default" className="text-md px-3 py-1">{count}</Badge>
                                  </div>
                                  {mealsForFocusedMeal.length > 0 ? (
                                      <div>
                                          <h4 className="text-sm font-body font-medium text-muted-foreground mb-1">Plats du menu ({focusedMealText.toLowerCase()}) concernés :</h4>
                                          <ul className="list-disc list-inside text-sm font-body space-y-0.5 ml-4">
                                              {mealsForFocusedMeal.map(meal => (
                                                  <li key={`${prepType}-${meal.id}`}>
                                                      {meal.name}
                                                      <span className="text-xs text-muted-foreground ml-1">({meal.category})</span>
                                                  </li>
                                              ))}
                                          </ul>
                                      </div>
                                  ) : (
                                      <p className="text-sm font-body text-muted-foreground italic">Menu du {focusedMealText.toLowerCase()} non spécifié (utilisation du menu par défaut).</p>
                                  )}
                              </div>
                          );
                      })}
                      {Object.values(globalTextureCountsForFocusedMeal).every(c => c === 0) && presentForFocusedMealCount > 0 && (
                           <p className="text-muted-foreground font-body text-center py-4">Aucune texture spécifique n'est requise pour les résidents présents, ou les données de texture sont manquantes.</p>
                      )}
                  </>
              ) : (
                   <p className="text-muted-foreground font-body text-center py-4">Aucun résident présent au {focusedMealText.toLowerCase()} pour calculer les textures.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Notifications Récentes</CardTitle>
              <CardDescription className="font-body">Dernières alertes et informations importantes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {clientSideRendered && dashboardNotifications.length > 0 ? (
                  dashboardNotifications.slice(0, 3).map(notif => (
                    <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-md border ${!notif.isRead ? 'bg-accent/10 border-accent' : 'bg-card'}`}>
                      <div className="pt-1">{getNotificationIcon(notif.type)}</div>
                      <div>
                        <p className={`font-semibold font-body ${!notif.isRead ? 'text-primary' : ''}`}>{notif.title}</p>
                        <p className="text-sm text-muted-foreground font-body">{notif.message}</p>
                        <p className="text-xs text-muted-foreground/70 font-body">{new Date(notif.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short'})}</p>
                      </div>
                    </div>
                  ))
                ) : clientSideRendered && dashboardNotifications.length === 0 ? (
                    <p className="text-muted-foreground font-body text-center py-4">Aucune notification récente.</p>
                ) : (
                 Array.from({length: 3}).map((_, i) => <div key={i} className="h-20 bg-muted rounded-md animate-pulse"></div>)
                )
              }
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


'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Notification, Resident, AttendanceRecord, Meal, WeeklyDayPlan, PlannedMealItem, MealType } from '@/types';
import { AlertTriangle, CheckCircle2, Info, Users, UtensilsCrossed, BellRing, ClipboardCheck, Upload, Building, CheckSquare, XSquare, MinusSquare, HelpCircle, UserX, Loader2, ServerCrash } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { handleMenuUpload } from './actions';
import { format, parseISO, isToday } from 'date-fns';
import { onResidentsUpdate } from '@/lib/firebase/firestoreClientService';


export const todayISO = new Date().toISOString().split('T')[0]; 
const LOCAL_STORAGE_ATTENDANCE_KEY_PREFIX = 'simulatedDailyAttendance_';

// Fallback mock attendance if localStorage is empty.
export const mockAttendanceFallback: AttendanceRecord[] = [
  { id: 'att_fb_1_lunch', residentId: 'residentId1_from_firestore', date: todayISO, mealType: 'lunch', status: 'present', mealLocation: 'dining_hall' },
  { id: 'att_fb_2_lunch', residentId: 'residentId2_from_firestore', date: todayISO, mealType: 'lunch', status: 'present', mealLocation: 'room' },
  { id: 'att_fb_3_lunch', residentId: 'residentId3_from_firestore', date: todayISO, mealType: 'lunch', status: 'absent', notes: 'Rendez-vous coiffeur', mealLocation: 'not_applicable' },
];


const initialMockMealsTodayForDashboard: Meal[] = [
  { id: 'fallback-s1', name: 'Velouté de Carottes (Défaut)', category: 'starter', dietTags: ['Végétarien', 'Sans Sel'], allergenTags: [], description: "Un velouté doux et parfumé." },
  { id: 'fallback-m1', name: 'Boeuf Bourguignon (Défaut)', category: 'main', dietTags: [], allergenTags: [], description: "Un classique mijoté lentement." },
  { id: 'fallback-d1', name: 'Crème Caramel (Défaut)', category: 'dessert', dietTags: [], allergenTags: ['Oeuf', 'Lactose'], description: "Dessert onctueux et gourmand." },
];


const mockDateReference = new Date('2024-07-15T10:00:00.000Z');

const mockNotifications: Notification[] = [
  { id: '1', timestamp: new Date(mockDateReference.getTime() - 3600000).toISOString(), type: 'absence', title: 'Absence Imprévue', message: 'Sophie Petit ne prendra pas son repas ce midi (Coiffeur).', isRead: false, relatedResidentId: '6' },
  { id: '2', timestamp: new Date(mockDateReference.getTime() - 7200000).toISOString(), type: 'info', title: 'Menu Spécial Anniversaire', message: 'Le dessert "Crème Caramel" est pour l\'anniversaire de Jean Dupont.', isRead: true },
  { id: '3', timestamp: new Date(mockDateReference.getTime() - 10800000).toISOString(), type: 'allergy_alert', title: 'Allergie Arachides', message: 'Attention cuisine: Jean Dupont (Ch. 101A) est allergique aux arachides.', isRead: false, relatedResidentId: '1' },
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

const plannedItemToMeal = (item: PlannedMealItem, idSuffix: string): Meal => ({
  id: `planned-${item.name.replace(/\s+/g, '-').toLowerCase()}-${idSuffix}`,
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

  const currentAttendanceKey = `${LOCAL_STORAGE_ATTENDANCE_KEY_PREFIX}${todayISO}`;

  useEffect(() => {
    setClientSideRendered(true);
    const storedPlan = localStorage.getItem('currentWeeklyPlan');
    if (storedPlan) {
      try {
        const parsedPlan = JSON.parse(storedPlan);
        setImportedWeeklyPlan(parsedPlan);
        const storedFileName = localStorage.getItem('currentWeeklyPlanFileName');
        if(storedFileName) setImportedFileName(storedFileName);
      } catch (e) {
        console.error("Error parsing stored weekly plan:", e);
        localStorage.removeItem('currentWeeklyPlan');
        localStorage.removeItem('currentWeeklyPlanFileName');
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
        setAllResidents([]); // Utiliser un tableau vide en cas d'erreur majeure
        setIsLoadingResidents(false);
    });
    return () => unsubscribe();

  }, [currentAttendanceKey, toast]); 

  const activeResidents = useMemo(() => allResidents.filter(r => r.isActive), [allResidents]);

  const mealsToDisplayForDashboard = useMemo(() => {
    if (!importedWeeklyPlan) return initialMockMealsTodayForDashboard;
    const todayPlan = importedWeeklyPlan.find(dayPlan => isToday(parseISO(dayPlan.date)));
    if (!todayPlan) return initialMockMealsTodayForDashboard;

    const todaysMeals: Meal[] = [];
    const lunch = todayPlan.meals.lunch;
    if (lunch.starter) todaysMeals.push(plannedItemToMeal(lunch.starter, 'lunch-starter'));
    if (lunch.main) todaysMeals.push(plannedItemToMeal(lunch.main, 'lunch-main'));
    if (lunch.dessert) todaysMeals.push(plannedItemToMeal(lunch.dessert, 'lunch-dessert'));
    
    return todaysMeals.length > 0 ? todaysMeals : initialMockMealsTodayForDashboard;
  }, [importedWeeklyPlan]);
  
  const isDisplayingImportedMenuForToday = useMemo(() => {
    if (!importedWeeklyPlan) return false;
    const todayPlan = importedWeeklyPlan.find(dayPlan => isToday(parseISO(dayPlan.date)));
    if (!todayPlan) return false;
    const lunch = todayPlan.meals.lunch;
    return !!(lunch.starter || lunch.main || lunch.dessert);
  }, [importedWeeklyPlan]);

  const presentResidentAttendances = useMemo(() => {
    return dailyAttendanceRecords.filter(a => 
      a.mealType === 'lunch' && 
      a.status === 'present' && 
      a.date === todayISO &&
      activeResidents.some(ar => ar.id === a.residentId) 
    );
  }, [activeResidents, dailyAttendanceRecords]);

  const totalActiveResidentsCount = activeResidents.length;
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
      case 'urgent_diet_request':
        return <UtensilsCrossed className="h-5 w-5 text-orange-600" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };
  
  const getAttendanceStatusBadge = (residentId: string, isActive: boolean): React.ReactNode => {
     if (!isActive) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-600"><UserX className="mr-1 h-4 w-4" />Inactif</Badge>;
    }
    const attendanceRecord = dailyAttendanceRecords.find(
      (att) => att.residentId === residentId && att.date === todayISO && att.mealType === 'lunch'
    );

    if (attendanceRecord) {
      switch (attendanceRecord.status) {
        case 'present':
          return <Badge variant="default" className="bg-green-100 text-green-700"><CheckSquare className="mr-1 h-4 w-4" />Présent(e)</Badge>;
        case 'absent':
          return <Badge variant="destructive" className="bg-red-100 text-red-700"><XSquare className="mr-1 h-4 w-4" />Absent(e)</Badge>;
        case 'external':
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700"><MinusSquare className="mr-1 h-4 w-4" />Extérieur</Badge>;
      }
    }
    return <Badge variant="outline"><HelpCircle className="mr-1 h-4 w-4" />Non Renseigné</Badge>;
  };
  
  const getAttendanceNotes = (residentId: string): string => {
    const attendanceRecord = dailyAttendanceRecords.find(
      (att) => att.residentId === residentId && att.date === todayISO && att.mealType === 'lunch'
    );
    return attendanceRecord?.notes || '-';
  };

  const globalTextureCountsForLunch = useMemo(() => {
    const counts: Record<PreparationType, number> = {
      'Normal': 0,
      'Mixé morceaux': 0,
      'Mixé lisse': 0,
      'Haché fin': 0,
      'Haché gros': 0,
    };
    presentResidentAttendances.forEach(att => {
        const resident = activeResidents.find(r => r.id === att.residentId);
        if (resident) {
            const prepType = getPreparationTypeForResident(resident);
            counts[prepType]++;
        }
    });
    return counts;
  }, [presentResidentAttendances, activeResidents]);


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
        if(result.fileName) localStorage.setItem('currentWeeklyPlanFileName', result.fileName); else localStorage.removeItem('currentWeeklyPlanFileName');

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
    localStorage.removeItem('currentWeeklyPlanFileName');
    toast({title: "Planning importé effacé", description: "Affichage du menu par défaut."});
  }


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
        <h1 className="text-3xl font-headline font-semibold text-foreground">Tableau de Bord</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline">Total Résidents Actifs</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingResidents ? <Loader2 className="h-6 w-6 animate-spin text-primary my-1" /> : <div className="text-2xl font-bold font-body">{totalActiveResidentsCount}</div>}
              <p className="text-xs text-muted-foreground font-body">
                {isLoadingResidents ? "Chargement..." : `${presentForLunchCount} présents au déjeuner aujourd'hui`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline">Repas à Préparer (Déjeuner)</CardTitle>
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            {isLoadingResidents ? <Loader2 className="h-6 w-6 animate-spin text-primary my-1" /> : <div className="text-2xl font-bold font-body">{presentForLunchCount}</div>}
              <p className="text-xs text-muted-foreground font-body">
                {isLoadingResidents ? "Calcul en cours..." : `Basé sur les résidents présents. ${dietSpecificMeals['Sans sel']} sans sel, ${dietSpecificMeals['Végétarien']} végé., ${dietSpecificMeals['Mixé']} mixés, ${dietSpecificMeals['Haché']} hachés.`}
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
                    <CardTitle className="font-headline">Total Textures à Préparer (Déjeuner)</CardTitle>
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
                Ce récapitulatif des textures est basé sur les résidents marqués comme présents pour le déjeuner.
                {importedFileName ? (
                    isDisplayingImportedMenuForToday ? (
                    <> Le menu du déjeuner provient du fichier importé : <strong>{importedFileName}</strong>.</>
                    ) : (
                    (() => {
                        if (!importedWeeklyPlan) { 
                        return <> Aucun planning Excel n'est actuellement chargé pour la semaine. Affichage basé sur le menu par défaut pour le déjeuner.</>;
                        }
                        const todayPlan = importedWeeklyPlan.find(dayPlan => isToday(parseISO(dayPlan.date)));
                        if (todayPlan) { 
                            return <> Planning <strong>{importedFileName}</strong> chargé, mais il ne contient pas de plats spécifiés pour le déjeuner d'aujourd'hui (vérifiez 'TypeRepas' et 'RolePlat' dans l'Excel). Affichage basé sur le menu par défaut.</>;
                        } else { 
                            return <> Planning <strong>{importedFileName}</strong> chargé, mais aucun menu n'y est défini pour la date d'aujourd'hui. Affichage basé sur le menu par défaut.</>;
                        }
                    })()
                    )
                ) : (
                    <> Aucun planning Excel n'a été importé. Affichage basé sur le menu par défaut pour le déjeuner.</>
                )}
                {importedFileName && <Button variant="link" size="sm" className="p-0 h-auto text-xs ml-1" onClick={clearImportedPlan}>Effacer le planning importé</Button>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingResidents ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 font-body text-muted-foreground">Chargement des données de préparation...</p></div>
            ) : presentForLunchCount > 0 ? (
                ALL_PREPARATION_TYPES.map(prepType => {
                    const count = globalTextureCountsForLunch[prepType];
                    if (count === 0 && prepType !== 'Normal') return null; // Ne pas afficher si 0, sauf pour "Normal" s'il est le seul
                    return (
                        <div key={prepType} className="flex items-center justify-between p-3 rounded-md border bg-background hover:bg-muted/30 transition-colors">
                            <p className="font-body text-md font-medium">{prepType}</p>
                            <Badge variant={count > 0 ? "default" : "outline"} className="text-md px-3 py-1">{count}</Badge>
                        </div>
                    );
                })
            ) : (
                 <p className="text-muted-foreground font-body text-center py-4">Aucun résident présent au déjeuner pour calculer les textures.</p>
            )}
            {!isLoadingResidents && presentForLunchCount > 0 && ALL_PREPARATION_TYPES.every(pt => globalTextureCountsForLunch[pt] === 0) && (
                 <p className="text-muted-foreground font-body text-center py-4">Les résidents présents n'ont pas de texture spécifiée ou sont tous en "Normal" sans autre texture requise.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Aperçu des Présences (Déjeuner)</CardTitle>
              <CardDescription className="font-body">Liste des résidents et leur statut pour le déjeuner du jour.</CardDescription>
            </CardHeader>
            <CardContent>
            {isLoadingResidents ? (
                <div className="flex justify-center items-center py-10"> <Loader2 className="h-6 w-6 animate-spin text-primary" /> <p className="ml-2 font-body text-muted-foreground">Chargement...</p></div>
            ) : activeResidents.length === 0 ? (
                <p className="text-muted-foreground font-body text-center py-4">Aucun résident actif trouvé.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-headline">Résident</TableHead>
                    <TableHead className="font-headline">Unité</TableHead>
                    <TableHead className="font-headline">Statut Déjeuner</TableHead>
                    <TableHead className="font-headline">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeResidents.slice(0,4).map(resident => (
                      <TableRow key={resident.id} className="font-body">
                        <TableCell className="flex items-center gap-2">
                           <Image src={resident?.avatarUrl || "https://placehold.co/32x32.png"} alt={resident?.firstName || ""} width={24} height={24} className="rounded-full" data-ai-hint="person avatar" />
                          {resident ? `${resident.firstName} ${resident.lastName}` : 'N/A'}
                        </TableCell>
                        <TableCell>{resident?.unit || 'N/A'}</TableCell>
                        <TableCell>
                          {getAttendanceStatusBadge(resident.id, resident.isActive)}
                        </TableCell>
                        <TableCell>{getAttendanceNotes(resident.id)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
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

    
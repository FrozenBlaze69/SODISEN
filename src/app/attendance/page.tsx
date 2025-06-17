
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Resident, AttendanceRecord, MealLocation, AttendanceStatus, MealType, Notification } from '@/types';
import { Save, Undo, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import Image from 'next/image';
import { onResidentsUpdate } from '@/lib/firebase/firestoreClientService';
import { useToast } from "@/hooks/use-toast";

const TODAY_ISO = new Date().toISOString().split('T')[0];
const LOCAL_STORAGE_ATTENDANCE_KEY_PREFIX = 'simulatedDailyAttendance_';
const SHARED_NOTIFICATIONS_KEY = 'sharedAppNotifications';

// Type for the optimized attendance data structure in state
type OptimizedAttendanceData = Record<string, {
  // residentId is the key
  [key in MealType]?: { status: AttendanceStatus; mealLocation: MealLocation; notes?: string }
}>;

const MEAL_TYPES: MealType[] = ['lunch', 'dinner']; // Breakfast removed

// Helper function for deep copying the OptimizedAttendanceData structure
const deepCopyOptimizedAttendance = (data: OptimizedAttendanceData): OptimizedAttendanceData => {
  const copy: OptimizedAttendanceData = {};
  for (const residentId in data) {
    copy[residentId] = {};
    const meals = data[residentId];
    if (meals) {
      for (const mealType in meals) {
        const mealDetails = meals[mealType as MealType];
        if (mealDetails && MEAL_TYPES.includes(mealType as MealType)) { // Ensure only relevant meal types are copied
          copy[residentId]![mealType as MealType] = { ...mealDetails };
        }
      }
    }
  }
  return copy;
};

// Helper functions for translation
const translateStatus = (status: AttendanceStatus): string => {
  switch (status) {
    case 'present': return 'présent(e)';
    case 'absent': return 'absent(e)';
    case 'external': return 'en extérieur';
    default: return status;
  }
};

const translateMealType = (mealType: MealType): string => {
  switch (mealType) {
    // case 'breakfast': return 'le petit-déjeuner'; // Removed
    case 'lunch': return 'le déjeuner';
    case 'dinner': return 'le dîner';
    case 'snack': return 'la collation'; // Kept for type consistency, though not in MEAL_TYPES for this page
    default: return mealType;
  }
};

const translateMealLocation = (location: MealLocation): string => {
  switch (location) {
    case 'dining_hall': return 'en salle à manger';
    case 'room': return 'en chambre';
    case 'not_applicable': return 'N/A';
    default: return location;
  }
};


export default function AttendancePage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<OptimizedAttendanceData>({});
  const [initialAttendanceDataForUndo, setInitialAttendanceDataForUndo] = useState<OptimizedAttendanceData>({});
  const { toast } = useToast();

  const currentLocalStorageKey = `${LOCAL_STORAGE_ATTENDANCE_KEY_PREFIX}${TODAY_ISO}`;

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onResidentsUpdate((updatedResidents) => {
      const activeResidents = updatedResidents.filter(r => r.isActive);
      setResidents(activeResidents);

      let storedAttendanceArray: AttendanceRecord[] = [];
      try {
        const storedData = localStorage.getItem(currentLocalStorageKey);
        if (storedData) {
          const parsedData = JSON.parse(storedData) as AttendanceRecord[];
          // Filter stored array for today AND for relevant meal types only
          storedAttendanceArray = parsedData.filter(ar => ar.date === TODAY_ISO && MEAL_TYPES.includes(ar.mealType));
        }
      } catch (e) {
        console.error("Error reading attendance from localStorage", e);
      }

      const newAttendanceDataObject: OptimizedAttendanceData = {};
      activeResidents.forEach(resident => {
        newAttendanceDataObject[resident.id] = {};
        MEAL_TYPES.forEach(mealType => {
          const existingRecord = storedAttendanceArray.find(
            ar => ar.residentId === resident.id && ar.mealType === mealType
          );
          if (existingRecord) {
            newAttendanceDataObject[resident.id]![mealType] = {
              status: existingRecord.status,
              mealLocation: existingRecord.mealLocation || 'not_applicable',
              notes: existingRecord.notes || '',
            };
          } else {
            newAttendanceDataObject[resident.id]![mealType] = {
              status: 'present',
              mealLocation: 'dining_hall',
              notes: '',
            };
          }
        });
      });

      setAttendanceData(newAttendanceDataObject);
      setInitialAttendanceDataForUndo(deepCopyOptimizedAttendance(newAttendanceDataObject));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [currentLocalStorageKey]);

  const handleAttendanceChange = (
    residentId: string,
    mealType: MealType,
    field: 'status' | 'mealLocation',
    value: AttendanceStatus | MealLocation
  ) => {
    setAttendanceData(prev => {
      const residentMealData = prev[residentId]?.[mealType] || { status: 'present', mealLocation: 'dining_hall', notes: ''};
      const updatedMealData = { ...residentMealData, [field]: value };

      if (field === 'status') {
        if (value === 'absent' || value === 'external') {
          updatedMealData.mealLocation = 'not_applicable';
        } else if (value === 'present' && updatedMealData.mealLocation === 'not_applicable') {
          updatedMealData.mealLocation = 'dining_hall'; 
        }
      }
      
      return {
        ...prev,
        [residentId]: {
          ...prev[residentId],
          [mealType]: updatedMealData,
        }
      };
    });
  };

  const getAttendanceValue = (
    residentId: string,
    mealType: MealType,
    field: 'status' | 'mealLocation'
  ): AttendanceStatus | MealLocation => {
    const mealData = attendanceData[residentId]?.[mealType];
    if (mealData) {
      return mealData[field];
    }
    // Default for lunch/dinner if not set
    return field === 'status' ? 'present' : 'dining_hall';
  };
  
  const getNotesForResidentRow = (residentId: string): string => {
    // Notes are shared, try getting from 'lunch' first, then 'dinner' if needed, or an empty string.
    // This assumes notes are applied to all meals in MEAL_TYPES via handleNotesChangeForRow.
    if (attendanceData[residentId]?.[MEAL_TYPES[0]]) {
      return attendanceData[residentId]?.[MEAL_TYPES[0]]?.notes || '';
    }
    return '';
  };

  const handleNotesChangeForRow = (residentId: string, notesValue: string) => {
    setAttendanceData(prev => {
      const updatedMealsForResident = { ...prev[residentId] };
      MEAL_TYPES.forEach(mealType => {
        const mealData = prev[residentId]?.[mealType] || { status: 'present', mealLocation: 'dining_hall' };
        updatedMealsForResident[mealType] = { ...mealData, notes: notesValue };
      });
      return {
        ...prev,
        [residentId]: updatedMealsForResident,
      };
    });
  };


  const handleSaveAttendances = () => {
    try {
      const dataToSave: AttendanceRecord[] = Object.entries(attendanceData).flatMap(([residentId, meals]) =>
        Object.entries(meals).map(([mealTypeStr, details]) => {
          const mealType = mealTypeStr as MealType;
          // Ensure we only save meal types that are part of our current MEAL_TYPES
          if (!MEAL_TYPES.includes(mealType)) return null; 
          return {
            id: `${residentId}-${mealType}-${TODAY_ISO}`, 
            residentId,
            date: TODAY_ISO,
            mealType,
            status: details.status,
            mealLocation: details.mealLocation,
            notes: details.notes,
          };
        }).filter(Boolean) as AttendanceRecord[] // filter(Boolean) removes nulls
      );
      localStorage.setItem(currentLocalStorageKey, JSON.stringify(dataToSave));
      
      const newNotifications: Notification[] = [];
      const residentMap = new Map(residents.map(r => [r.id, r]));

      Object.keys(attendanceData).forEach(residentId => {
        const resident = residentMap.get(residentId);
        if (!resident) return;

        MEAL_TYPES.forEach(mealType => { // This will iterate only over lunch and dinner
          const currentData = attendanceData[residentId]?.[mealType];
          const initialData = initialAttendanceDataForUndo[residentId]?.[mealType];

          if (!currentData || !initialData) return; 

          if (currentData.status !== initialData.status) {
            newNotifications.push({
              id: `notif-${Date.now()}-${residentId}-${mealType}-status`,
              timestamp: new Date().toISOString(),
              type: currentData.status === 'absent' || currentData.status === 'external' ? 'absence' : 'attendance',
              title: `Changement de Présence`,
              message: `${resident.firstName} ${resident.lastName} est maintenant ${translateStatus(currentData.status)} pour ${translateMealType(mealType)}.`,
              isRead: false,
              relatedResidentId: residentId,
            });
          }

          if (currentData.status === 'present' && initialData.status === 'present' && 
              currentData.mealLocation !== initialData.mealLocation && 
              currentData.mealLocation !== 'not_applicable') {
             newNotifications.push({
                id: `notif-${Date.now()}-${residentId}-${mealType}-location`,
                timestamp: new Date().toISOString(),
                type: 'info',
                title: `Changement Lieu Repas`,
                message: `${resident.firstName} ${resident.lastName} mangera ${translateMealLocation(currentData.mealLocation)} pour ${translateMealType(mealType)}.`,
                isRead: false,
                relatedResidentId: residentId,
            });
          }
        });
      });

      if (newNotifications.length > 0) {
        try {
          const existingNotificationsRaw = localStorage.getItem(SHARED_NOTIFICATIONS_KEY);
          let allNotifications: Notification[] = existingNotificationsRaw ? JSON.parse(existingNotificationsRaw) : [];
          allNotifications = [...newNotifications, ...allNotifications]; 
          localStorage.setItem(SHARED_NOTIFICATIONS_KEY, JSON.stringify(allNotifications));
        } catch (e) {
          console.error("Error saving new notifications to localStorage", e);
        }
      }

      setInitialAttendanceDataForUndo(deepCopyOptimizedAttendance(attendanceData));
      toast({ title: "Présences Enregistrées", description: "Les modifications et notifications ont été sauvegardées localement." });
    } catch (e) {
      console.error("Error saving attendance to localStorage", e);
      toast({ variant: "destructive", title: "Erreur de Sauvegarde", description: "Impossible de sauvegarder les présences." });
    }
  };

  const handleUndoChanges = () => {
    setAttendanceData(deepCopyOptimizedAttendance(initialAttendanceDataForUndo));
    toast({ title: "Modifications Annulées", description: "Les présences ont été réinitialisées." });
  };


  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Suivi des Présences</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled><ChevronLeft className="h-4 w-4"/></Button>
            <Select defaultValue={TODAY_ISO} disabled>
              <SelectTrigger className="w-[180px] font-body">
                <SelectValue placeholder="Choisir une date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODAY_ISO}>{new Date(TODAY_ISO).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" disabled><ChevronRight className="h-4 w-4"/></Button>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="font-body" onClick={handleUndoChanges} disabled={isLoading}>
              <Undo className="mr-2 h-5 w-5" />
              Annuler Modifications
            </Button>
            <Button className="font-body bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSaveAttendances} disabled={isLoading}>
              <Save className="mr-2 h-5 w-5" />
              Enregistrer Présences
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Grille des Présences du {new Date(TODAY_ISO).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</CardTitle>
            <CardDescription className="font-body">
              Modifiez les présences et cliquez sur "Enregistrer Présences". Les notes générales sont partagées pour tous les repas du résident pour ce jour.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 font-body text-muted-foreground">Chargement des données de présence...</p>
                </div>
            ) : residents.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground font-body">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg">Aucun résident actif trouvé.</p>
                    <p className="text-sm">Veuillez ajouter des résidents actifs via la page "Gérer les Résidents".</p>
                </div>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-headline sticky left-0 bg-card z-10 min-w-[200px]">Résident</TableHead>
                    {MEAL_TYPES.map(mealType => (
                      <React.Fragment key={mealType}>
                        <TableHead className="text-center font-headline min-w-[140px]">
                          {mealType === 'lunch' ? 'Déjeuner' : 'Dîner'} (Statut)
                        </TableHead>
                        <TableHead className="text-center font-headline min-w-[150px]">
                          Lieu
                        </TableHead>
                      </React.Fragment>
                    ))}
                     <TableHead className="font-headline text-center min-w-[200px]">Notes Générales (jour)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {residents.map((resident) => (
                    <TableRow key={resident.id} className="font-body">
                      <TableCell className="font-medium sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-2">
                          <Image 
                            src={resident.avatarUrl || "https://placehold.co/32x32.png"} 
                            alt={`${resident.firstName} ${resident.lastName}`} 
                            width={32} 
                            height={32} 
                            className="rounded-full"
                            data-ai-hint="person avatar"
                          />
                           <span>{resident.lastName}, {resident.firstName}</span>
                        </div>
                      </TableCell>
                      {MEAL_TYPES.map(mealType => (
                        <React.Fragment key={`${resident.id}-${mealType}`}>
                        <TableCell className="text-center">
                          <Select 
                            value={getAttendanceValue(resident.id, mealType, 'status')}
                            onValueChange={(value) => handleAttendanceChange(resident.id, mealType, 'status', value as AttendanceStatus)}
                          >
                            <SelectTrigger className="w-[120px] mx-auto">
                              <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Présent</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="external">Extérieur</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                         <TableCell className="text-center">
                          <Select 
                            value={getAttendanceValue(resident.id, mealType, 'mealLocation')}
                            onValueChange={(value) => handleAttendanceChange(resident.id, mealType, 'mealLocation', value as MealLocation)}
                            disabled={getAttendanceValue(resident.id, mealType, 'status') === 'absent' || getAttendanceValue(resident.id, mealType, 'status') === 'external'}
                          >
                            <SelectTrigger className="w-[140px] mx-auto">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dining_hall">Salle à manger</SelectItem>
                                <SelectItem value="room">En chambre</SelectItem>
                                <SelectItem value="not_applicable">N/A (si absent/ext.)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        </React.Fragment>
                      ))}
                      <TableCell className="text-center">
                         <input 
                            type="text" 
                            placeholder="Motif absence/externe..." 
                            className="p-2 border rounded-md w-full text-sm" 
                            value={getNotesForResidentRow(resident.id)} 
                            onChange={(e) => handleNotesChangeForRow(resident.id, e.target.value)}
                         />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

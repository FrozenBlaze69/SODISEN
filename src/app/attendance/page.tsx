
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Resident, AttendanceRecord, MealLocation, AttendanceStatus, MealType } from '@/types';
import { Save, Undo, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import Image from 'next/image';
import { onResidentsUpdate } from '@/lib/firebase/firestoreClientService';
import { useToast } from "@/hooks/use-toast"; // Import useToast

const today = new Date().toISOString().split('T')[0];
const LOCAL_STORAGE_ATTENDANCE_KEY_PREFIX = 'simulatedDailyAttendance_';

// Fallback mock data if localStorage is empty or for residents not yet in localStorage.
// This helps ensure every resident has some default selectable value.
const mockAttendanceRecordsForFallback: AttendanceRecord[] = [
  // { id: 'ar1', residentId: '1', date: today, mealType: 'breakfast', status: 'present', mealLocation: 'dining_hall' },
  // Ensure residentId here can match actual resident IDs from Firestore for effective fallback.
];

export default function AttendancePage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [initialAttendanceDataForUndo, setInitialAttendanceDataForUndo] = useState<AttendanceRecord[]>([]);
  const { toast } = useToast();

  const mealTypes: Array<MealType> = ['breakfast', 'lunch', 'dinner'];
  const currentLocalStorageKey = `${LOCAL_STORAGE_ATTENDANCE_KEY_PREFIX}${today}`;

  const generateDefaultAttendances = useCallback((activeResidents: Resident[]): AttendanceRecord[] => {
    return activeResidents.flatMap(resident =>
      mealTypes.map(mealType => {
        // Attempt to find a fallback mock record if needed (e.g. for specific preferences)
        const fallbackRecord = mockAttendanceRecordsForFallback.find(
          ar => ar.residentId === resident.id && ar.mealType === mealType && ar.date === today
        );
        return {
          id: `${resident.id}-${mealType}-${today}`, // Ensure unique ID
          residentId: resident.id,
          date: today,
          mealType: mealType,
          status: fallbackRecord?.status || 'present',
          mealLocation: fallbackRecord?.mealLocation || 'dining_hall',
          notes: fallbackRecord?.notes || '',
        };
      })
    );
  }, [mealTypes]); // today could be a dependency if it changed, but it's module-level const

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onResidentsUpdate((updatedResidents) => {
      const activeResidents = updatedResidents.filter(r => r.isActive);
      setResidents(activeResidents);

      let loadedAttendances: AttendanceRecord[] = [];
      try {
        const storedData = localStorage.getItem(currentLocalStorageKey);
        if (storedData) {
          const parsedData = JSON.parse(storedData) as AttendanceRecord[];
          // Ensure data is for today
          loadedAttendances = parsedData.filter(ar => ar.date === today);
        }
      } catch (e) {
        console.error("Error reading attendance from localStorage", e);
      }

      // Merge loadedAttendances with a default structure for all active residents
      // This ensures every resident has an entry, even if not in localStorage yet.
      const finalAttendances = activeResidents.flatMap(resident =>
        mealTypes.map(mealType => {
          const existingRecord = loadedAttendances.find(
            ar => ar.residentId === resident.id && ar.mealType === mealType && ar.date === today
          );
          if (existingRecord) return existingRecord;

          const fallbackRecord = mockAttendanceRecordsForFallback.find(
            ar => ar.residentId === resident.id && ar.mealType === mealType && ar.date === today
          );
          return {
            id: `${resident.id}-${mealType}-${today}`,
            residentId: resident.id,
            date: today,
            mealType: mealType,
            status: fallbackRecord?.status || 'present',
            mealLocation: fallbackRecord?.mealLocation || 'dining_hall',
            notes: fallbackRecord?.notes || '',
          };
        })
      );
      
      if (loadedAttendances.length === 0 && activeResidents.length > 0 && !localStorage.getItem(currentLocalStorageKey)) {
          // If nothing in local storage and we have residents, generate defaults
          const defaultGenerated = generateDefaultAttendances(activeResidents);
          setAttendanceData(defaultGenerated);
          setInitialAttendanceDataForUndo(JSON.parse(JSON.stringify(defaultGenerated)));
      } else {
          setAttendanceData(finalAttendances);
          setInitialAttendanceDataForUndo(JSON.parse(JSON.stringify(finalAttendances)));
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [currentLocalStorageKey, generateDefaultAttendances, mealTypes]);


  const handleAttendanceChange = (
    residentId: string,
    mealType: MealType,
    field: keyof Omit<AttendanceRecord, 'id' | 'residentId' | 'date' | 'mealType'>,
    value: string | MealLocation | AttendanceStatus
  ) => {
    setAttendanceData(prevData =>
      prevData.map(record => {
        if (record.residentId === residentId && record.mealType === mealType) {
          const updatedRecord = { ...record, [field]: value };
          if (field === 'status' && (value === 'absent' || value === 'external')) {
            updatedRecord.mealLocation = 'not_applicable';
          } else if (field === 'status' && value === 'present' && updatedRecord.mealLocation === 'not_applicable') {
            updatedRecord.mealLocation = 'dining_hall';
          }
          return updatedRecord;
        }
        return record;
      })
    );
  };

  const getAttendanceValue = (
    residentId: string,
    mealType: MealType,
    field: keyof Omit<AttendanceRecord, 'id' | 'residentId' | 'date' | 'mealType'>
  ): AttendanceRecord[keyof AttendanceRecord] => {
    const record = attendanceData.find(ar => ar.residentId === residentId && ar.mealType === mealType);
    if (record) {
        return record[field as keyof AttendanceRecord];
    }
    if (field === 'status') return 'present';
    if (field === 'mealLocation') return 'dining_hall';
    return '';
  }

  const handleSaveAttendances = () => {
    try {
      localStorage.setItem(currentLocalStorageKey, JSON.stringify(attendanceData));
      setInitialAttendanceDataForUndo(JSON.parse(JSON.stringify(attendanceData)));
      toast({ title: "Présences Enregistrées", description: "Les modifications ont été sauvegardées localement." });
    } catch (e) {
      console.error("Error saving attendance to localStorage", e);
      toast({ variant: "destructive", title: "Erreur de Sauvegarde", description: "Impossible de sauvegarder les présences." });
    }
  };

  const handleUndoChanges = () => {
    setAttendanceData(JSON.parse(JSON.stringify(initialAttendanceDataForUndo)));
    toast({ title: "Modifications Annulées", description: "Les présences ont été réinitialisées." });
  };

  // For the single notes field per resident row in the UI
  const getNotesForResidentRow = (residentId: string) => {
    // Display notes from the 'dinner' record, or first available if 'dinner' has no notes.
    const dinnerRecord = attendanceData.find(ar => ar.residentId === residentId && ar.mealType === 'dinner');
    if (dinnerRecord && dinnerRecord.notes) return dinnerRecord.notes;
    const anyRecordWithNotes = attendanceData.find(ar => ar.residentId === residentId && ar.notes);
    return anyRecordWithNotes?.notes || '';
  };

  const handleNotesChangeForRow = (residentId: string, notesValue: string) => {
    // Update notes for all meal records for that resident for the day, or a specific one.
    // For simplicity, let's set it on the 'dinner' record as per original implication.
    setAttendanceData(prevData =>
      prevData.map(record => {
        if (record.residentId === residentId && record.mealType === 'dinner') { // Or apply to all: record.date === today
          return { ...record, notes: notesValue };
        }
        return record;
      })
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Suivi des Présences</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" disabled><ChevronLeft className="h-4 w-4"/></Button>
            <Select defaultValue={today} disabled>
              <SelectTrigger className="w-[180px] font-body">
                <SelectValue placeholder="Choisir une date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={today}>{new Date(today).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" disabled><ChevronRight className="h-4 w-4"/></Button>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="font-body" onClick={handleUndoChanges}>
              <Undo className="mr-2 h-5 w-5" />
              Annuler Modifications
            </Button>
            <Button className="font-body bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSaveAttendances}>
              <Save className="mr-2 h-5 w-5" />
              Enregistrer Présences
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Grille des Présences du {new Date(today).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</CardTitle>
            <CardDescription className="font-body">
              Modifiez les présences et cliquez sur "Enregistrer Présences".
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2 font-body text-muted-foreground">Chargement des résidents...</p>
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
                    {mealTypes.map(mealType => (
                      <React.Fragment key={mealType}>
                        <TableHead className="text-center font-headline min-w-[140px]">
                          {mealType === 'breakfast' ? 'P. Déj.' : mealType === 'lunch' ? 'Déjeuner' : 'Dîner'} (Statut)
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
                      {mealTypes.map(mealType => (
                        <React.Fragment key={`${resident.id}-${mealType}`}>
                        <TableCell className="text-center">
                          <Select 
                            value={getAttendanceValue(resident.id, mealType, 'status') as AttendanceStatus}
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
                            value={getAttendanceValue(resident.id, mealType, 'mealLocation') as MealLocation}
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

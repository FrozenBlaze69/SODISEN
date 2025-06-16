
'use client';
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Resident, AttendanceRecord, MealLocation } from '@/types';
import { Save, Undo, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import Image from 'next/image';
import { onResidentsUpdate } from '@/lib/firebase/firestoreClientService';

// Assume today's date for attendance
const today = new Date().toISOString().split('T')[0];

// Mock Attendance Data - This will be used to populate attendance for the real residents
const mockAttendanceRecords: AttendanceRecord[] = [
  // Assurez-vous que les residentId ici peuvent correspondre à des IDs de vos résidents Firestore
  { id: 'ar1', residentId: '1', date: today, mealType: 'breakfast', status: 'present', mealLocation: 'dining_hall' },
  { id: 'ar2', residentId: '1', date: today, mealType: 'lunch', status: 'present', mealLocation: 'dining_hall' },
  { id: 'ar3', residentId: '1', date: today, mealType: 'dinner', status: 'absent', notes: "Chez sa fille", mealLocation: 'not_applicable' },
  { id: 'ar4', residentId: '2', date: today, mealType: 'breakfast', status: 'present', mealLocation: 'room' },
  { id: 'ar5', residentId: '2', date: today, mealType: 'lunch', status: 'absent', notes: "Rdv médecin", mealLocation: 'not_applicable' },
  { id: 'ar6', residentId: '2', date: today, mealType: 'dinner', status: 'present', mealLocation: 'room' },
  // Ajoutez plus de données fictives si nécessaire, en essayant de faire correspondre les residentId
  // avec ceux que vous avez dans Firestore (par exemple, si vous avez un résident avec l'ID 'firebaseResidentId1')
  // { id: 'ar_firebase1_lunch', residentId: 'firebaseResidentId1', date: today, mealType: 'lunch', status: 'present', mealLocation: 'dining_hall' },
];


export default function AttendancePage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onResidentsUpdate((updatedResidents) => {
      setResidents(updatedResidents.filter(r => r.isActive)); // On ne charge que les résidents actifs
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const mealTypes: Array<AttendanceRecord['mealType']> = ['breakfast', 'lunch', 'dinner'];

  const getResidentAttendanceValue = (residentId: string, mealType: AttendanceRecord['mealType'], field: keyof Omit<AttendanceRecord, 'id' | 'residentId' | 'date'>): AttendanceRecord[keyof AttendanceRecord] => {
    const record = mockAttendanceRecords.find(ar => ar.residentId === residentId && ar.mealType === mealType && ar.date === today);
    if (record) {
        return record[field as keyof AttendanceRecord];
    }
    // Default values if no record found
    if (field === 'status') return 'present';
    if (field === 'mealLocation') return 'dining_hall';
    return ''; // For notes or other fields
  }
  
  const mealLocationLabel = (location?: MealLocation): string => {
    if (location === 'dining_hall') return 'Salle à manger';
    if (location === 'room') return 'En chambre';
    if (location === 'not_applicable') return 'N/A (absent/externe)';
    return 'N/A';
  }


  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Suivi des Présences</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4"/></Button>
            <Select defaultValue={today}>
              <SelectTrigger className="w-[180px] font-body">
                <SelectValue placeholder="Choisir une date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={today}>{new Date(today).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</SelectItem>
                {/* Add more dates if needed */}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4"/></Button>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="font-body">
              <Undo className="mr-2 h-5 w-5" />
              Annuler Modifications
            </Button>
            <Button className="font-body bg-accent text-accent-foreground hover:bg-accent/90">
              <Save className="mr-2 h-5 w-5" />
              Enregistrer Présences
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Grille des Présences du {new Date(today).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</CardTitle>
            <CardDescription className="font-body">
              Cochez les cases pour marquer les présences/absences des résidents pour chaque repas et leur lieu.
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
                     <TableHead className="font-headline text-center min-w-[200px]">Notes (si absence/externe)</TableHead>
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
                          <Select defaultValue={getResidentAttendanceValue(resident.id, mealType, 'status') as AttendanceRecord['status']}>
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
                          <Select defaultValue={getResidentAttendanceValue(resident.id, mealType, 'mealLocation') as MealLocation || 'not_applicable'}>
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
                         <input type="text" placeholder="Motif..." className="p-2 border rounded-md w-full text-sm" defaultValue={getResidentAttendanceValue(resident.id, 'dinner', 'notes') as string || ''}/>
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

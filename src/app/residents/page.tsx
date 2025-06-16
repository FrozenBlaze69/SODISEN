
'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Resident, AttendanceRecord } from '@/types';
import { PlusCircle, MoreHorizontal, FilePenLine, UserX, UserCheck, MinusSquare, HelpCircle, Loader2, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { onResidentsUpdate } from '@/lib/firebase/firestoreClientService'; 
import { mockAttendanceFallback } from '@/app/page'; // Import mockAttendanceFallback from dashboard page
// todayISO est nécessaire pour filtrer les présences du jour
const todayISO = new Date().toISOString().split('T')[0];


export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // S'abonner aux mises à jour des résidents depuis Firestore
    const unsubscribe = onResidentsUpdate((updatedResidents) => {
      setResidents(updatedResidents);
      setIsLoading(false);
    });

    // Nettoyer l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, []);


  const getResidentLunchStatus = (residentId: string, isActive: boolean): React.ReactNode => {
    if (!isActive) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-600"><UserX className="mr-1 h-4 w-4" />Inactif</Badge>;
    }

    // Utilise mockAttendanceFallback pour le statut du déjeuner
    const attendanceRecord = mockAttendanceFallback.find(
      (att: AttendanceRecord) => att.residentId === residentId && att.date === todayISO && att.mealType === 'lunch'
    );

    if (attendanceRecord) {
      switch (attendanceRecord.status) {
        case 'present':
          return <Badge variant="default" className="bg-green-100 text-green-700"><UserCheck className="mr-1 h-4 w-4" />Présent(e)</Badge>;
        case 'absent':
          return <Badge variant="destructive" className="bg-red-100 text-red-700"><UserX className="mr-1 h-4 w-4" />Absent(e)</Badge>;
        case 'external':
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700"><MinusSquare className="mr-1 h-4 w-4" />Extérieur</Badge>;
        default: 
          return <Badge variant="outline"><HelpCircle className="mr-1 h-4 w-4" />Non Renseigné</Badge>;
      }
    }
    return <Badge variant="outline"><HelpCircle className="mr-1 h-4 w-4" />Présence Non Renseignée</Badge>;
  };


  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Liste des Résidents</h1>
          <Button asChild className="font-body"> 
            <Link href="/manage-residents">
              <PlusCircle className="mr-2 h-5 w-5" />
              Gérer les Résidents
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Users className="h-6 w-6 text-primary"/>
                Informations des Résidents
            </CardTitle>
            <CardDescription className="font-body">
              Consultez les informations des résidents récupérées depuis la base de données et leur statut de présence au déjeuner du jour.
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
                    <p className="text-lg">Aucun résident trouvé.</p>
                    <p className="text-sm">Commencez par ajouter des résidents via la page "Gérer les Résidents".</p>
                     <Button asChild className="font-body mt-4"> 
                        <Link href="/manage-residents">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Ajouter un résident
                        </Link>
                    </Button>
                </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] font-headline">Avatar</TableHead>
                      <TableHead className="font-headline">Nom</TableHead>
                      <TableHead className="font-headline">Unité</TableHead>
                      <TableHead className="font-headline">Chambre</TableHead>
                      <TableHead className="font-headline">Statut (Déjeuner)</TableHead>
                      <TableHead className="font-headline">Régimes</TableHead>
                      <TableHead className="font-headline">Textures</TableHead>
                      <TableHead className="font-headline">Allergies</TableHead>
                      <TableHead className="text-right font-headline">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {residents.map((resident) => (
                      <TableRow key={resident.id} className="font-body">
                        <TableCell>
                          <Image 
                            src={resident.avatarUrl || "https://placehold.co/40x40.png"} 
                            alt={`${resident.firstName} ${resident.lastName}`} 
                            width={32} 
                            height={32} 
                            className="rounded-full"
                            data-ai-hint="person avatar"
                          />
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{resident.lastName}, {resident.firstName}</TableCell>
                        <TableCell>{resident.unit}</TableCell>
                        <TableCell>{resident.roomNumber || 'N/A'}</TableCell>
                        <TableCell>
                            {getResidentLunchStatus(resident.id, resident.isActive)}
                        </TableCell>
                        <TableCell>
                          {resident.diets && resident.diets.length > 0 ? 
                            resident.diets.slice(0, 2).map(d => <Badge key={d} variant="secondary" className="mr-1 mb-1 whitespace-nowrap">{d}</Badge>) : 
                            '-'}
                          {resident.diets && resident.diets.length > 2 && <Badge variant="outline">+{resident.diets.length - 2}</Badge>}
                        </TableCell>
                        <TableCell>
                          {resident.textures && resident.textures.length > 0 ? 
                            resident.textures.slice(0, 2).map(t => <Badge key={t} variant="outline" className="mr-1 mb-1 whitespace-nowrap">{t}</Badge>) : 
                            '-'}
                           {resident.textures && resident.textures.length > 2 && <Badge variant="outline">+{resident.textures.length - 2}</Badge>}
                        </TableCell>
                        <TableCell>
                          {resident.allergies && resident.allergies.length > 0 ? 
                            resident.allergies.slice(0, 1).map(allergy => <Badge key={allergy} variant="destructive" className="bg-red-100 text-red-500 mr-1 mb-1 whitespace-nowrap">{allergy}</Badge>) : 
                            '-'}
                          {resident.allergies && resident.allergies.length > 1 && <Badge variant="destructive" className="bg-red-100 text-red-500">+{resident.allergies.length -1}</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-5 w-5" />
                                <span className="sr-only">Actions pour {resident.firstName} {resident.lastName}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/manage-residents?edit=${resident.id}`}>
                                  <FilePenLine className="mr-2 h-4 w-4" />
                                  Modifier / Voir Fiche
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

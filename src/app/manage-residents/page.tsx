
'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, UserPlus, Loader2 } from 'lucide-react';
import type { Resident } from '@/types';
// Updated import path for onResidentsUpdate
import { onResidentsUpdate } from '@/lib/firebase/firestoreClientService'; 
import { addResidentToFirestore, updateResidentPresenceInFirestore, deleteResidentFromFirestore } from '@/lib/firebase/firestoreService';
import { useToast } from "@/hooks/use-toast";

export default function ManageResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [newResidentName, setNewResidentName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onResidentsUpdate((updatedResidents) => {
      setResidents(updatedResidents);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddResident = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newResidentName.trim()) {
      toast({ title: "Erreur", description: "Le nom du résident ne peut pas être vide.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await addResidentToFirestore(newResidentName.trim());
      setNewResidentName('');
      toast({ title: "Succès", description: "Résident ajouté avec succès." });
    } catch (error) {
      console.error("Failed to add resident: ", error);
      toast({ title: "Erreur", description: "Impossible d'ajouter le résident.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleTogglePresence = async (residentId: string, currentPresence: boolean) => {
    try {
      await updateResidentPresenceInFirestore(residentId, !currentPresence);
      toast({ title: "Statut mis à jour", description: `Présence de ${residents.find(r => r.id === residentId)?.firstName} mise à jour.` });
    } catch (error) {
      console.error("Failed to update presence: ", error);
      toast({ title: "Erreur", description: "Impossible de mettre à jour la présence.", variant: "destructive" });
    }
  };

  const handleDeleteResident = async (residentId: string, residentName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${residentName} ? Cette action est irréversible.`)) {
      try {
        await deleteResidentFromFirestore(residentId);
        toast({ title: "Succès", description: `${residentName} a été supprimé.` });
      } catch (error) {
        console.error("Failed to delete resident: ", error);
        toast({ title: "Erreur", description: `Impossible de supprimer ${residentName}.`, variant: "destructive" });
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-headline font-semibold text-foreground">Gestion des Résidents (Temps Réel)</h1>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><UserPlus className="h-6 w-6 text-primary"/>Ajouter un Nouveau Résident</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddResident} className="flex flex-col sm:flex-row items-end gap-4">
              <div className="flex-grow">
                <Label htmlFor="residentName" className="font-body">Nom du résident</Label>
                <Input
                  id="residentName"
                  type="text"
                  value={newResidentName}
                  onChange={(e) => setNewResidentName(e.target.value)}
                  placeholder="Prénom Nom"
                  className="font-body"
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="font-body w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Ajouter
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Liste des Résidents</CardTitle>
            <CardDescription className="font-body">
              Liste des résidents enregistrés dans Firestore. Les modifications sont mises à jour en temps réel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 font-body text-muted-foreground">Chargement des résidents...</p>
              </div>
            ) : residents.length === 0 ? (
                <p className="text-center text-muted-foreground font-body py-6">Aucun résident trouvé. Ajoutez-en un pour commencer.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-headline">Nom</TableHead>
                      <TableHead className="font-headline text-center w-[150px]">Présent(e)</TableHead>
                      <TableHead className="font-headline text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {residents.map((resident) => (
                      <TableRow key={resident.id} className="font-body">
                        <TableCell className="font-medium">{resident.firstName} {resident.lastName}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Switch
                              id={`presence-${resident.id}`}
                              checked={resident.present}
                              onCheckedChange={() => handleTogglePresence(resident.id, resident.present)}
                              aria-label={`Marquer ${resident.firstName} ${resident.present ? 'absent(e)' : 'présent(e)'}`}
                            />
                            <Label htmlFor={`presence-${resident.id}`} className="text-sm">
                              {resident.present ? 'Oui' : 'Non'}
                            </Label>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleDeleteResident(resident.id, resident.firstName)}
                            aria-label={`Supprimer ${resident.firstName}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
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

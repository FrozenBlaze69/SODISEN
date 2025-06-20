
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, UserPlus, Edit, Loader2, RotateCcw, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Resident, ResidentFormData } from '@/types';
import { onResidentsUpdate } from '@/lib/firebase/firestoreClientService';
import { addOrUpdateResident, deleteResidentFromFirestore } from '@/lib/firebase/firestoreService';
import { useToast } from "@/hooks/use-toast";
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const PREDEFINED_UNITS = ["Jardin", "Vignes", "Colline", "Forêt", "Rivière", "Roseau", "Pinède", "Non assignée"];

const residentFormSchema = z.object({
  firstName: z.string().min(1, { message: "Le prénom est requis." }),
  lastName: z.string().min(1, { message: "Le nom de famille est requis." }),
  unit: z.string().min(1, { message: "L'unité est requise." }),
  roomNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  avatarUrl: z.string().url({ message: "Veuillez entrer une URL valide pour l'avatar." }).optional().or(z.literal('')),
  medicalSpecificities: z.string().optional(),
  diets: z.string().optional(), 
  textures: z.string().optional(), 
  allergies: z.string().optional(), 
  contraindications: z.string().optional(), 
  isActive: z.boolean().default(true),
});

type ResidentFormValues = z.infer<typeof residentFormSchema>;

const defaultFormValues: ResidentFormValues = {
  firstName: '',
  lastName: '',
  unit: '', // Default to empty, placeholder will show in Select
  roomNumber: '',
  dateOfBirth: '',
  avatarUrl: '',
  medicalSpecificities: '',
  diets: '',
  textures: '',
  allergies: '',
  contraindications: '',
  isActive: true,
};

export default function ManageResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleteResidentDialogOpen, setIsDeleteResidentDialogOpen] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<{ id: string; name: string } | null>(null);
  
  const { toast } = useToast();

  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(residentFormSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onResidentsUpdate((updatedResidents) => {
      setResidents(updatedResidents);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const stringToArray = (str: string | undefined): string[] => {
    if (!str) return [];
    return str.split(',').map(item => item.trim()).filter(Boolean);
  };

  const arrayToString = (arr: string[] | undefined): string => {
    if (!arr) return '';
    return arr.join(', ');
  };

  const onSubmit: SubmitHandler<ResidentFormValues> = async (data) => {
    setIsSubmittingForm(true);
    startTransition(async () => {
      const residentDataToSave: ResidentFormData = {
        ...data,
        diets: stringToArray(data.diets),
        textures: stringToArray(data.textures),
        allergies: stringToArray(data.allergies),
        contraindications: stringToArray(data.contraindications),
      };

      try {
        const residentId = editingResident ? editingResident.id : undefined;
        await addOrUpdateResident(residentDataToSave, residentId);
        toast({ title: "Succès", description: `Résident ${editingResident ? 'mis à jour' : 'ajouté'} avec succès.` });
        form.reset(defaultFormValues);
        setEditingResident(null);
      } catch (error) {
        console.error("Failed to save resident: ", error);
        toast({ title: "Erreur", description: `Impossible de ${editingResident ? 'mettre à jour' : 'd\'ajouter'} le résident. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
      } finally {
        setIsSubmittingForm(false);
      }
    });
  };

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    form.reset({
      firstName: resident.firstName,
      lastName: resident.lastName,
      unit: resident.unit, // This will set the Select value
      roomNumber: resident.roomNumber || '',
      dateOfBirth: resident.dateOfBirth || '',
      avatarUrl: resident.avatarUrl || '',
      medicalSpecificities: resident.medicalSpecificities || '',
      diets: arrayToString(resident.diets),
      textures: arrayToString(resident.textures),
      allergies: arrayToString(resident.allergies),
      contraindications: arrayToString(resident.contraindications),
      isActive: resident.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingResident(null);
    form.reset(defaultFormValues);
  };
  
  const openDeleteResidentDialog = (residentId: string, residentName: string) => {
    setResidentToDelete({ id: residentId, name: residentName });
    setIsDeleteResidentDialogOpen(true);
  };

  const confirmDeleteResident = async () => {
    if (!residentToDelete) return;

    setIsDeleting(true);
    try {
      await deleteResidentFromFirestore(residentToDelete.id);
      toast({ title: "Succès", description: `${residentToDelete.name} a été supprimé.` });
      if (editingResident?.id === residentToDelete.id) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Failed to delete resident: ", error);
      toast({ title: "Erreur", description: `Impossible de supprimer ${residentToDelete.name}. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setIsDeleteResidentDialogOpen(false);
      setResidentToDelete(null);
    }
  };


  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-headline font-semibold text-foreground">
          {editingResident ? 'Modifier un Résident' : 'Ajouter un Nouveau Résident'}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary"/>
              Informations du Résident
            </CardTitle>
            {editingResident && (
                <Button variant="outline" size="sm" onClick={handleCancelEdit} className="font-body max-w-fit" disabled={isSubmittingForm || isPending || isDeleting}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Annuler la modification (créer nouveau)
                </Button>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="firstName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl><Input placeholder="Jean" {...field} disabled={isSubmittingForm || isPending || isDeleting} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lastName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl><Input placeholder="Dupont" {...field} disabled={isSubmittingForm || isPending || isDeleting} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unité</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value || ''} disabled={isSubmittingForm || isPending || isDeleting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une unité" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PREDEFINED_UNITS.map(unitName => (
                              <SelectItem key={unitName} value={unitName}>{unitName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="roomNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de Chambre</FormLabel>
                      <FormControl><Input placeholder="101A" {...field} disabled={isSubmittingForm || isPending || isDeleting} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de Naissance (JJ/MM/AAAA)</FormLabel>
                      <FormControl><Input placeholder="01/01/1940" {...field} disabled={isSubmittingForm || isPending || isDeleting} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="avatarUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de l'Avatar (optionnel)</FormLabel>
                      <FormControl><Input placeholder="https://example.com/avatar.png" {...field} disabled={isSubmittingForm || isPending || isDeleting} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                <FormField control={form.control} name="medicalSpecificities" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spécificités Médicales (optionnel)</FormLabel>
                    <FormControl><Textarea placeholder="Diabète, hypertension..." {...field} disabled={isSubmittingForm || isPending || isDeleting} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="diets" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Régimes (séparés par une virgule)</FormLabel>
                      <FormControl><Input placeholder="Sans sel, Végétarien" {...field} disabled={isSubmittingForm || isPending || isDeleting} /></FormControl>
                      <FormDescription>Ex: Sans sel, Hypocalorique, Diabétique</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="textures" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Textures (séparées par une virgule)</FormLabel>
                      <FormControl><Input placeholder="Mixé lisse, Haché fin" {...field} disabled={isSubmittingForm || isPending || isDeleting} /></FormControl>
                      <FormDescription>Ex: Normal, Mixé lisse, Haché fin, Morceaux</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="allergies" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies (séparées par une virgule)</FormLabel>
                      <FormControl><Input placeholder="Arachides, Gluten" {...field} disabled={isSubmittingForm || isPending || isDeleting} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="contraindications" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contre-indications (séparées par une virgule)</FormLabel>
                      <FormControl><Input placeholder="Pamplemousse, Anticoagulants" {...field} disabled={isSubmittingForm || isPending || isDeleting} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Résident Actif</FormLabel>
                      <FormDescription>Indique si le résident est actuellement actif dans l'établissement.</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmittingForm || isPending || isDeleting} /></FormControl>
                  </FormItem>
                )} />
                
                <Button type="submit" className="w-full sm:w-auto font-body" disabled={isSubmittingForm || isPending || isDeleting}>
                  {(isSubmittingForm || isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingResident ? <Edit className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />)}
                  {editingResident ? 'Mettre à jour le résident' : 'Ajouter le résident'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>Liste des Résidents</CardTitle>
            <CardDescription className="font-body">
              Liste des résidents enregistrés. Les modifications sont mises à jour en temps réel.
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
                      <TableHead className="font-headline">Avatar</TableHead>
                      <TableHead className="font-headline">Nom Complet</TableHead>
                      <TableHead className="font-headline">Unité</TableHead>
                      <TableHead className="font-headline">Chambre</TableHead>
                      <TableHead className="font-headline">Statut</TableHead>
                      <TableHead className="font-headline">Régimes</TableHead>
                      <TableHead className="font-headline">Textures</TableHead>
                      <TableHead className="font-headline text-right w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {residents.map((resident) => (
                      <TableRow key={resident.id} className={`font-body ${editingResident?.id === resident.id ? 'bg-primary/10' : ''}`}>
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
                        <TableCell className="font-medium">{resident.lastName}, {resident.firstName}</TableCell>
                        <TableCell>{resident.unit}</TableCell>
                        <TableCell>{resident.roomNumber || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={resident.isActive ? 'default' : 'outline'} className={resident.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {resident.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                            {resident.diets?.slice(0, 2).map(d => <Badge key={d} variant="secondary" className="mr-1 mb-1">{d}</Badge>)}
                            {resident.diets && resident.diets.length > 2 && <Badge variant="outline">+{resident.diets.length - 2}</Badge>}
                            {(!resident.diets || resident.diets.length === 0) && '-'}
                        </TableCell>
                         <TableCell className="whitespace-nowrap">
                            {resident.textures?.slice(0, 2).map(t => <Badge key={t} variant="outline" className="mr-1 mb-1">{t}</Badge>)}
                            {resident.textures && resident.textures.length > 2 && <Badge variant="outline">+{resident.textures.length - 2}</Badge>}
                            {(!resident.textures || resident.textures.length === 0) && '-'}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                           <Button
                            variant="ghost"
                            size="icon"
                            className="text-primary hover:text-primary/90"
                            onClick={() => handleEdit(resident)}
                            aria-label={`Modifier ${resident.firstName} ${resident.lastName}`}
                            disabled={isSubmittingForm || isPending || isDeleting}
                          >
                            <Edit className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => openDeleteResidentDialog(resident.id, `${resident.firstName} ${resident.lastName}`)}
                            aria-label={`Supprimer ${resident.firstName} ${resident.lastName}`}
                            disabled={isSubmittingForm || isPending || isDeleting}
                          >
                             {isDeleting && residentToDelete?.id === resident.id ? <Loader2 className="h-5 w-5 animate-spin"/> : <Trash2 className="h-5 w-5" />}
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
      <AlertDialog open={isDeleteResidentDialogOpen} onOpenChange={setIsDeleteResidentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {residentToDelete?.name ?? 'ce résident'} ? Cette action est irréversible et le résident sera supprimé de la base de données.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResidentToDelete(null)} disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteResident} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

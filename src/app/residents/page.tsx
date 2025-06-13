
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Resident } from '@/types';
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, Utensils, Stethoscope, Vegan } from 'lucide-react';
import Image from 'next/image';

// Mock Data for Residents
const mockResidents: Resident[] = [
  { 
    id: '1', firstName: 'Jean', lastName: 'Dupont', roomNumber: '101A', 
    dietaryRestrictions: [], // Keep for now, may deprecate in favor of 'diets'
    allergies: ['Arachides'], medicalSpecificities: 'Insuffisance cardiaque légère', 
    isActive: true, avatarUrl: 'https://placehold.co/40x40.png',
    unit: 'Unité A', 
    contraindications: ['Pamplemousse (médicament)'], 
    textures: ['Normal'], 
    diets: ['Sans sel', 'Diabétique'] 
  },
  { 
    id: '2', firstName: 'Aline', lastName: 'Martin', roomNumber: '102B', 
    dietaryRestrictions: [], 
    allergies: [], medicalSpecificities: 'Difficultés de déglutition', 
    isActive: true, avatarUrl: 'https://placehold.co/40x40.png',
    unit: 'Unité B', 
    contraindications: [], 
    textures: ['Mixé lisse'], 
    diets: ['Hyperprotéiné'] 
  },
  { 
    id: '3', firstName: 'Pierre', lastName: 'Durand', roomNumber: '205A', 
    dietaryRestrictions: [], 
    allergies: ['Gluten'], medicalSpecificities: '', 
    isActive: true, avatarUrl: 'https://placehold.co/40x40.png',
    unit: 'Unité A', 
    contraindications: [], 
    textures: ['Haché fin'], 
    diets: ['Végétarien'] 
  },
  { 
    id: '4', firstName: 'Sophie', lastName: 'Leroy', roomNumber: '210C', 
    dietaryRestrictions: [], 
    allergies: ['Lactose', 'Noix'], medicalSpecificities: 'Tendance aux fausses routes', 
    isActive: false, avatarUrl: 'https://placehold.co/40x40.png',
    unit: 'Unité B', 
    contraindications: ['Fruits à coque'], 
    textures: ['Normal'], 
    diets: [] 
  },
];

export default function ResidentsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Gestion des Résidents</h1>
          <Button className="font-body">
            <PlusCircle className="mr-2 h-5 w-5" />
            Ajouter Résident
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Liste des Résidents</CardTitle>
            <CardDescription className="font-body">
              Consultez et gérez les informations des résidents.
              {/* TODO: Ajouter filtres par unité ici */}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] font-headline">Avatar</TableHead>
                  <TableHead className="font-headline">Nom</TableHead>
                  <TableHead className="font-headline">Unité</TableHead>
                  <TableHead className="font-headline">Chambre</TableHead>
                  <TableHead className="font-headline">Régimes (Diets)</TableHead>
                  <TableHead className="font-headline">Textures</TableHead>
                  <TableHead className="font-headline">Allergies</TableHead>
                  <TableHead className="font-headline">Contre-ind.</TableHead>
                  <TableHead className="font-headline">Statut</TableHead>
                  <TableHead className="text-right font-headline">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockResidents.map((resident) => (
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
                      {resident.diets.length > 0 ? 
                        resident.diets.map(d => <Badge key={d} variant="secondary" className="mr-1 mb-1 whitespace-nowrap">{d}</Badge>) : 
                        '-'}
                    </TableCell>
                    <TableCell>
                      {resident.textures.length > 0 ? 
                        resident.textures.map(t => <Badge key={t} variant="outline" className="mr-1 mb-1 whitespace-nowrap">{t}</Badge>) : 
                        '-'}
                    </TableCell>
                    <TableCell>
                      {resident.allergies.length > 0 ? 
                        resident.allergies.map(allergy => <Badge key={allergy} variant="destructive" className="mr-1 mb-1 whitespace-nowrap">{allergy}</Badge>) : 
                        '-'}
                    </TableCell>
                    <TableCell>
                      {resident.contraindications.length > 0 ? 
                        resident.contraindications.map(ci => <Badge key={ci} variant="destructive" className="bg-orange-100 text-orange-700 mr-1 mb-1 whitespace-nowrap">{ci}</Badge>) : 
                        '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={resident.isActive ? 'default' : 'outline'} className={resident.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {resident.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FilePenLine className="mr-2 h-4 w-4" />
                            Modifier {/* TODO: Implémenter formulaire de modification */}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Resident } from '@/types';
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2 } from 'lucide-react';
import Image from 'next/image';

// Mock Data for Residents
const mockResidents: Resident[] = [
  { id: '1', firstName: 'Jean', lastName: 'Dupont', roomNumber: '101A', dietaryRestrictions: ['Sans sel', 'Diabétique'], allergies: ['Arachides'], medicalSpecificities: 'Insuffisance cardiaque légère', isActive: true, avatarUrl: 'https://placehold.co/40x40.png' },
  { id: '2', firstName: 'Aline', lastName: 'Martin', roomNumber: '102B', dietaryRestrictions: ['Mixé'], allergies: [], medicalSpecificities: 'Difficultés de déglutition', isActive: true, avatarUrl: 'https://placehold.co/40x40.png' },
  { id: '3', firstName: 'Pierre', lastName: 'Durand', roomNumber: '205A', dietaryRestrictions: ['Végétarien'], allergies: ['Gluten'], medicalSpecificities: '', isActive: true, avatarUrl: 'https://placehold.co/40x40.png' },
  { id: '4', firstName: 'Sophie', lastName: 'Leroy', roomNumber: '210C', dietaryRestrictions: [], allergies: ['Lactose', 'Noix'], medicalSpecificities: 'Tendance aux fausses routes', isActive: false, avatarUrl: 'https://placehold.co/40x40.png' },
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
              Consultez et gérez les informations des résidents de l'EHPAD.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] font-headline">Avatar</TableHead>
                  <TableHead className="font-headline">Nom Complet</TableHead>
                  <TableHead className="font-headline">Chambre</TableHead>
                  <TableHead className="font-headline">Régimes</TableHead>
                  <TableHead className="font-headline">Allergies</TableHead>
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
                        width={40} 
                        height={40} 
                        className="rounded-full"
                        data-ai-hint="person avatar"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{resident.lastName}, {resident.firstName}</TableCell>
                    <TableCell>{resident.roomNumber || 'N/A'}</TableCell>
                    <TableCell>
                      {resident.dietaryRestrictions.length > 0 ? 
                        resident.dietaryRestrictions.map(dr => <Badge key={dr} variant="secondary" className="mr-1 mb-1">{dr}</Badge>) : 
                        '-'}
                    </TableCell>
                    <TableCell>
                      {resident.allergies.length > 0 ? 
                        resident.allergies.map(allergy => <Badge key={allergy} variant="destructive" className="mr-1 mb-1">{allergy}</Badge>) : 
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
                            Modifier
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

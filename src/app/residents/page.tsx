
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Resident, AttendanceRecord } from '@/types';
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, CheckSquare, XSquare, MinusSquare, HelpCircle, UserX, UserCheck } from 'lucide-react';
import Image from 'next/image';
import { mockAttendance } from '@/app/page'; // Import mockAttendance from dashboard page
import { format, parseISO, isToday } from 'date-fns'; // To get today's date consistently

const todayISO = new Date().toISOString().split('T')[0];

// Mock Data for Residents - this should ideally come from a shared source or Firestore
const mockResidents: Resident[] = [
  { 
    id: '1', firstName: 'Jean', lastName: 'Dupont', roomNumber: '101A', 
    allergies: ['Arachides'], medicalSpecificities: 'Insuffisance cardiaque légère', 
    isActive: true, avatarUrl: 'https://placehold.co/40x40.png',
    unit: 'Unité A', 
    contraindications: ['Pamplemousse (médicament)'], 
    textures: ['Normal'], 
    diets: ['Sans sel', 'Diabétique'] 
  },
  { 
    id: '2', firstName: 'Aline', lastName: 'Martin', roomNumber: '102B', 
    allergies: [], medicalSpecificities: 'Difficultés de déglutition', 
    isActive: true, avatarUrl: 'https://placehold.co/40x40.png',
    unit: 'Unité B', 
    contraindications: [], 
    textures: ['Mixé lisse'], 
    diets: ['Hyperprotéiné'] 
  },
  { 
    id: '3', firstName: 'Pierre', lastName: 'Durand', roomNumber: '205A', 
    allergies: ['Gluten'], medicalSpecificities: '', 
    isActive: true, avatarUrl: 'https://placehold.co/40x40.png',
    unit: 'Unité A', 
    contraindications: [], 
    textures: ['Haché fin'], 
    diets: ['Végétarien'] 
  },
  { 
    id: '4', firstName: 'Sophie', lastName: 'Leroy', roomNumber: '210C', 
    allergies: ['Lactose', 'Noix'], medicalSpecificities: 'Tendance aux fausses routes', 
    isActive: false, avatarUrl: 'https://placehold.co/40x40.png', // This resident is inactive
    unit: 'Unité B', 
    contraindications: ['Fruits à coque'], 
    textures: ['Normal'], 
    diets: [] 
  },
   { 
    id: '6', firstName: 'Sophie', lastName: 'Petit', roomNumber: '203C', // Same as resident 6 from dashboard
    allergies: [], medicalSpecificities: '', 
    isActive: true, avatarUrl: 'https://placehold.co/40x40.png',
    unit: 'Unité B', contraindications: ['Soja'], 
    textures: ['Normal'], diets: ['Diabétique'] 
  },
];


export default function ResidentsPage() {

  const getResidentLunchStatus = (residentId: string, isActive: boolean): React.ReactNode => {
    if (!isActive) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-600"><UserX className="mr-1 h-4 w-4" />Inactif</Badge>;
    }

    const attendanceRecord = mockAttendance.find(
      att => att.residentId === residentId && att.date === todayISO && att.mealType === 'lunch'
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
          {/* Link to manage-residents page might be more appropriate here */}
          <Button asChild className="font-body"> 
            <a href="/manage-residents">
              <PlusCircle className="mr-2 h-5 w-5" />
              Gérer les Résidents
            </a>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Informations des Résidents</CardTitle>
            <CardDescription className="font-body">
              Consultez les informations des résidents et leur statut de présence au déjeuner du jour.
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
                  <TableHead className="font-headline">Statut (Déjeuner)</TableHead>
                  <TableHead className="font-headline">Régimes</TableHead>
                  <TableHead className="font-headline">Textures</TableHead>
                  <TableHead className="font-headline">Allergies</TableHead>
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
                        {getResidentLunchStatus(resident.id, resident.isActive)}
                    </TableCell>
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
                        resident.allergies.map(allergy => <Badge key={allergy} variant="destructive" className="bg-red-100 text-red-500 mr-1 mb-1 whitespace-nowrap">{allergy}</Badge>) : 
                        '-'}
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
                          <DropdownMenuItem onClick={() => alert(`Redirection vers modification de ${resident.firstName} (à implémenter)`)}>
                            <FilePenLine className="mr-2 h-4 w-4" />
                            Modifier Fiche Résident
                          </DropdownMenuItem>
                           {/* L'option de suppression d'un résident serait plutôt sur manage-residents */}
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

    
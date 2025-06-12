import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Notification, Resident, AttendanceRecord, Meal } from '@/types';
import { AlertTriangle, CheckCircle2, Info, Users, UtensilsCrossed, BellRing } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Mock Data
const mockResidents: Resident[] = [
  { id: '1', firstName: 'Jean', lastName: 'Dupont', dietaryRestrictions: ['Sans sel'], allergies: ['Arachides'], medicalSpecificities: 'Diabète type 2', isActive: true, avatarUrl: 'https://placehold.co/40x40.png' },
  { id: '2', firstName: 'Marie', lastName: 'Curie', dietaryRestrictions: ['Végétarien'], allergies: [], medicalSpecificities: 'Hypertension', isActive: true, avatarUrl: 'https://placehold.co/40x40.png' },
];

const mockAttendance: AttendanceRecord[] = [
  { id: 'att1', residentId: '1', date: new Date().toISOString().split('T')[0], mealType: 'lunch', status: 'present' },
  { id: 'att2', residentId: '2', date: new Date().toISOString().split('T')[0], mealType: 'lunch', status: 'absent', notes: 'Rendez-vous médical' },
];

const mockMeals: Meal[] = [
    { id: 'm1', name: 'Poulet Yassa', category: 'main', dietTags: ['Normal'], allergenTags: [] },
    { id: 'm2', name: 'Poisson Vapeur', category: 'main', dietTags: ['Sans Sel'], allergenTags: [] },
    { id: 'm3', name: 'Salade Composée', category: 'main', dietTags: ['Végétarien'], allergenTags: [] },
];


const mockNotifications: Notification[] = [
  { id: '1', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'absence', title: 'Absence Imprévue', message: 'Paul Martin ne prendra pas son repas ce midi.', isRead: false, relatedResidentId: '1' },
  { id: '2', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'outing', title: 'Sortie Extérieure', message: 'Paola Leroy déjeune en famille ce midi.', isRead: true, relatedResidentId: '2' },
  { id: '3', timestamp: new Date(Date.now() - 10800000).toISOString(), type: 'info', title: 'Présence Confirmée', message: 'Tous les résidents de l\'étage A sont présents.', isRead: true },
];


export default function DashboardPage() {
  const totalResidents = mockResidents.length;
  const presentForLunch = mockAttendance.filter(a => a.mealType === 'lunch' && a.status === 'present').length;
  
  // Placeholder meal summary calculation
  const totalMealsToPrepare = presentForLunch; // Simplified
  const dietSpecificMeals = {
    'Sans sel': mockAttendance.filter(a => a.status === 'present' && mockResidents.find(r => r.id === a.residentId)?.dietaryRestrictions.includes('Sans sel')).length,
    'Végétarien': mockAttendance.filter(a => a.status === 'present' && mockResidents.find(r => r.id === a.residentId)?.dietaryRestrictions.includes('Végétarien')).length,
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'allergy_alert':
      case 'emergency':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'absence':
      case 'outing':
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-headline font-semibold text-foreground">Tableau de Bord</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline">Résidents Actifs</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-body">{totalResidents}</div>
              <p className="text-xs text-muted-foreground font-body">
                {presentForLunch} présents au déjeuner d'aujourd'hui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-headline">Repas à Préparer (Déjeuner)</CardTitle>
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-body">{totalMealsToPrepare}</div>
              <p className="text-xs text-muted-foreground font-body">
                {dietSpecificMeals['Sans sel']} sans sel, {dietSpecificMeals['Végétarien']} végétariens
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

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Aperçu des Présences (Déjeuner)</CardTitle>
              <CardDescription className="font-body">Liste des résidents et leur statut pour le déjeuner.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-headline">Résident</TableHead>
                    <TableHead className="font-headline">Statut</TableHead>
                    <TableHead className="font-headline">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAttendance.slice(0,3).map(att => {
                    const resident = mockResidents.find(r => r.id === att.residentId);
                    return (
                      <TableRow key={att.id} className="font-body">
                        <TableCell className="flex items-center gap-2">
                           <Image src={resident?.avatarUrl || "https://placehold.co/40x40.png"} alt={resident?.firstName || ""} width={24} height={24} className="rounded-full" data-ai-hint="person avatar" />
                          {resident ? `${resident.firstName} ${resident.lastName}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={att.status === 'present' ? 'default' : att.status === 'absent' ? 'destructive' : 'secondary'} className="bg-primary/20 text-primary-foreground">
                            {att.status === 'present' ? 'Présent(e)' : att.status === 'absent' ? 'Absent(e)' : 'Extérieur'}
                          </Badge>
                        </TableCell>
                        <TableCell>{att.notes || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Link href="/attendance">
                  <Button variant="outline" className="w-full font-body">Gérer les Présences</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Notifications Récentes</CardTitle>
              <CardDescription className="font-body">Dernières alertes et informations importantes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockNotifications.slice(0, 3).map(notif => (
                <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-md border ${!notif.isRead ? 'bg-accent/10 border-accent' : 'bg-card'}`}>
                  <div className="pt-1">{getNotificationIcon(notif.type)}</div>
                  <div>
                    <p className="font-semibold font-body">{notif.title}</p>
                    <p className="text-sm text-muted-foreground font-body">{notif.message}</p>
                    <p className="text-xs text-muted-foreground/70 font-body">{new Date(notif.timestamp).toLocaleString('fr-FR')}</p>
                  </div>
                </div>
              ))}
              <div className="mt-4">
                 <Link href="/notifications">
                  <Button variant="outline" className="w-full font-body">Voir toutes les notifications</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

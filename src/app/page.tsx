
'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Notification, Resident, AttendanceRecord, Meal } from '@/types';
import { AlertTriangle, CheckCircle2, Info, Users, UtensilsCrossed, BellRing, ClipboardCheck } from 'lucide-react';
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

const mockMealsToday: Meal[] = [
  { id: 's1', name: 'Velouté de Légumes de Saison', category: 'starter', dietTags: ['Normal', 'Végétarien'], allergenTags: ['Céleri'] },
  { id: 's2', name: 'Salade de Chèvre Chaud', category: 'starter', dietTags: ['Normal'], allergenTags: ['Gluten', 'Lactose'] },
  { id: 'm1', name: 'Poulet Rôti et Gratin Dauphinois', category: 'main', dietTags: ['Normal'], allergenTags: ['Lactose'] },
  { id: 'm2', name: 'Filet de Colin, Riz et Petits Légumes', category: 'main', dietTags: ['Sans Sel'], allergenTags: [] },
  { id: 'm3', name: 'Lasagnes Végétariennes', category: 'main', dietTags: ['Végétarien'], allergenTags: ['Gluten', 'Lactose'] },
  { id: 'd1', name: 'Mousse au Chocolat Maison', category: 'dessert', dietTags: ['Normal'], allergenTags: ['Oeuf', 'Lactose'] },
  { id: 'd2', name: 'Salade de Fruits Frais', category: 'dessert', dietTags: ['Normal', 'Végétarien', 'Sans Sel'], allergenTags: [] },
];


const mockNotifications: Notification[] = [
  { id: '1', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'absence', title: 'Absence Imprévue', message: 'Paul Martin ne prendra pas son repas ce midi.', isRead: false, relatedResidentId: '1' },
  { id: '2', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'outing', title: 'Sortie Extérieure', message: 'Paola Leroy déjeune en famille ce midi.', isRead: true, relatedResidentId: '2' },
  { id: '3', timestamp: new Date(Date.now() - 10800000).toISOString(), type: 'info', title: 'Présence Confirmée', message: 'Tous les résidents de l\'étage A sont présents.', isRead: true },
];


export default function DashboardPage() {
  const [mealPreparationStatus, setMealPreparationStatus] = useState<Record<string, boolean>>({});

  const totalResidents = mockResidents.length;
  const presentForLunch = mockAttendance.filter(a => a.mealType === 'lunch' && a.status === 'present').length;
  
  const totalMealsToPrepare = presentForLunch; 
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

  const handleMealStatusChange = (mealId: string, isReady: boolean) => {
    setMealPreparationStatus(prev => ({ ...prev, [mealId]: isReady }));
  };

  const categorizedMeals: Record<string, Meal[]> = mockMealsToday.reduce((acc, meal) => {
    const category = meal.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(meal);
    return acc;
  }, {} as Record<string, Meal[]>);

  const categoryOrder: Meal['category'][] = ['starter', 'main', 'dessert', 'snack', 'drink'];
  const categoryLabels: Record<Meal['category'], string> = {
    starter: 'Entrées',
    main: 'Plats Principaux',
    dessert: 'Desserts',
    snack: 'Collations',
    drink: 'Boissons',
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline">Suivi Préparation Repas (Déjeuner)</CardTitle>
            </div>
            <CardDescription className="font-body">
              Cochez les plats prêts. Portions indicatives pour {presentForLunch} présents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryOrder.map(category => {
              const mealsInCategory = categorizedMeals[category];
              if (!mealsInCategory || mealsInCategory.length === 0) {
                return null;
              }
              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold font-body text-primary mb-3 border-b pb-2">{categoryLabels[category]}</h3>
                  <div className="space-y-3">
                    {mealsInCategory.map(meal => (
                      <div key={meal.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`meal-prep-${meal.id}`}
                            checked={!!mealPreparationStatus[meal.id]}
                            onCheckedChange={(checked) => handleMealStatusChange(meal.id, !!checked)}
                            aria-label={`Marquer ${meal.name} comme prêt`}
                          />
                          <Label htmlFor={`meal-prep-${meal.id}`} className="font-body text-sm cursor-pointer">
                            {meal.name}
                          </Label>
                        </div>
                        <Badge variant="outline" className="font-body text-xs">{presentForLunch} portions</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {Object.keys(categorizedMeals).length === 0 && mockMealsToday.length === 0 && (
                <p className="text-muted-foreground font-body text-center py-4">Aucun plat programmé pour ce service.</p>
            )}
          </CardContent>
        </Card>

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

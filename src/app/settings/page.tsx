
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserCog, Palette, ShieldCheck, BellDot } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-headline font-semibold text-foreground">Paramètres</h1>

        <Card>
          <CardHeader>
            <UserCog className="h-6 w-6 mb-2 text-primary" />
            <CardTitle className="font-headline">Profil Utilisateur</CardTitle>
            <CardDescription className="font-body">Gérez les informations de votre compte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" defaultValue="Utilisateur Sodexo" />
              </div>
              <div>
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input id="email" type="email" defaultValue="user@sodexo.com" />
              </div>
            </div>
            <Button>Mettre à jour le profil</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BellDot className="h-6 w-6 mb-2 text-primary" />
            <CardTitle className="font-headline">Préférences de Notification</CardTitle>
            <CardDescription className="font-body">Choisissez comment vous souhaitez recevoir les notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="flex-grow">Notifications par e-mail</Label>
              <Switch id="email-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="inapp-notifications" className="flex-grow">Notifications dans l'application (temps réel)</Label>
              <Switch id="inapp-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="summary-notifications" className="flex-grow">Résumé quotidien par e-mail</Label>
              <Switch id="summary-notifications" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Palette className="h-6 w-6 mb-2 text-primary" />
            <CardTitle className="font-headline">Apparence</CardTitle>
            <CardDescription className="font-body">Personnalisez l'apparence de l'application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 font-body">
             <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex-grow">Mode Sombre</Label>
              <Switch id="dark-mode" />
            </div>
            {/* More appearance settings can be added here */}
          </CardContent>
        </Card>

        {/* Placeholder for user role management if admin */}
        {/* This would typically be on a separate /admin/users page */}
        {true && ( // Replace true with actual role check, e.g. user.role === 'chef_gerant'
          <Card>
            <CardHeader>
                <ShieldCheck className="h-6 w-6 mb-2 text-primary" />
              <CardTitle className="font-headline">Gestion des Utilisateurs (Admin)</CardTitle>
              <CardDescription className="font-body">
                Ajoutez, modifiez ou supprimez des utilisateurs et leurs rôles. (Accessible aux administrateurs)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="font-body w-full">Accéder à la gestion des utilisateurs</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

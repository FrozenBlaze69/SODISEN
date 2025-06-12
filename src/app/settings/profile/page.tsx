
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';

export default function ProfileSettingsPage() {
  // Placeholder user data
  const user = {
    name: 'Utilisateur Sodexo',
    email: 'user@sodexo.com',
    role: 'Chef Gérant',
    avatarUrl: 'https://placehold.co/128x128.png',
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-headline font-semibold text-foreground">Mon Profil</h1>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Informations Personnelles</CardTitle>
            <CardDescription className="font-body">Mettez à jour vos informations personnelles et votre mot de passe.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 font-body">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="user avatar" />
                  <AvatarFallback className="text-4xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="icon" className="absolute bottom-0 right-0 rounded-full bg-background">
                  <Camera className="h-5 w-5" />
                  <span className="sr-only">Changer l'avatar</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" defaultValue={user.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" type="email" defaultValue={user.email} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Input id="role" defaultValue={user.role} disabled />
            </div>

            <hr className="my-6" />

            <h3 className="font-headline text-lg font-semibold">Changer le mot de passe</h3>
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input id="confirm-password" type="password" />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline">Annuler</Button>
                <Button>Enregistrer les modifications</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { User, UserRole } from '@/types';
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, UserRoundPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mock Data for Users
const mockUsers: User[] = [
  { id: 'u1', name: 'Alice Dubois', email: 'alice.dubois@sodexo.com', role: 'chef_gerant', avatarUrl: 'https://placehold.co/40x40.png' },
  { id: 'u2', name: 'Bob Leclerc', email: 'bob.leclerc@sodexo.com', role: 'cuisinier', avatarUrl: 'https://placehold.co/40x40.png' },
  { id: 'u3', name: 'Carla Moreau', email: 'carla.moreau@sodexo.com', role: 'soignant', avatarUrl: 'https://placehold.co/40x40.png' },
  { id: 'u4', name: 'David Petit', email: 'david.petit@sodexo.com', role: 'famille_invite', avatarUrl: 'https://placehold.co/40x40.png' },
];

const roleLabels: Record<UserRole, string> = {
  chef_gerant: 'Chef Gérant',
  cuisinier: 'Cuisinier',
  soignant: 'Soignant / Éducateur',
  famille_invite: 'Famille / Invité',
};

export default function UserManagementPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-headline font-semibold text-foreground">Gestion des Utilisateurs</h1>
          <Button className="font-body">
            <UserRoundPlus className="mr-2 h-5 w-5" />
            Ajouter Utilisateur
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Liste des Utilisateurs</CardTitle>
            <CardDescription className="font-body">
              Gérez les comptes utilisateurs et leurs permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] font-headline">Avatar</TableHead>
                  <TableHead className="font-headline">Nom</TableHead>
                  <TableHead className="font-headline">Email</TableHead>
                  <TableHead className="font-headline">Rôle</TableHead>
                  <TableHead className="text-right font-headline">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((user) => (
                  <TableRow key={user.id} className="font-body">
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl || "https://placehold.co/40x40.png"} alt={user.name} data-ai-hint="user avatar" />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabels[user.role]}</Badge>
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


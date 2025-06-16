
'use client';

import type { UserRole, AuthContextType, User } from '@/types';
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const MOCK_USERS_PINS: Record<string, { role: UserRole, name: string, avatar?: string }> = {
  '1111': { role: 'chef_gerant', name: 'Chef Gérant', avatar: 'https://placehold.co/40x40.png?text=CG' },
  '2222': { role: 'cuisinier', name: 'Cuisinier', avatar: 'https://placehold.co/40x40.png?text=C' },
  '3333': { role: 'soignant', name: 'Soignant', avatar: 'https://placehold.co/40x40.png?text=S' },
  '4444': { role: 'famille_invite', name: 'Invité/Famille', avatar: 'https://placehold.co/40x40.png?text=IF' },
};

const defaultAuthContextValue: AuthContextType = {
  currentUser: null,
  login: async () => false,
  logout: () => {},
  isLoading: true,
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContextValue);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Try to load user from localStorage on initial mount
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        // Basic validation, you might want to add more checks
        if (parsedUser && parsedUser.role && parsedUser.id && parsedUser.name) {
          setCurrentUser(parsedUser);
        } else {
          localStorage.removeItem('currentUser'); // Clear invalid item
        }
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      localStorage.removeItem('currentUser');
    }
    setIsLoading(false);
  }, []);

  const login = async (pin: string): Promise<boolean> => {
    setIsLoading(true);
    const matchedUser = MOCK_USERS_PINS[pin];
    if (matchedUser) {
      const user: User = {
        id: pin, // Using PIN as ID for this simulation
        role: matchedUser.role,
        name: matchedUser.name,
        avatarUrl: matchedUser.avatar,
      };
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setIsLoading(false);
      return true;
    }
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    router.push('/login'); // Redirect to login page after logout
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

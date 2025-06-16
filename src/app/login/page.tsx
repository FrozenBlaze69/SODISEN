
'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LogIn, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const loginFormSchema = z.object({
  pin: z.string().min(4, { message: "Le PIN doit contenir au moins 4 chiffres." }).regex(/^\d+$/, { message: "Le PIN ne doit contenir que des chiffres." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      pin: '',
    },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsSubmitting(true);
    setError(null);
    const success = await login(data.pin);
    if (success) {
      router.push('/'); // Redirect to dashboard on successful login
    } else {
      setError("PIN incorrect. Veuillez réessayer.");
    }
    setIsSubmitting(false);
  };
  
  // Skip login if already authenticated - this might cause a flicker if AuthContext is still loading
  // const { currentUser, isLoading: authIsLoading } = useAuth();
  // useEffect(() => {
  //   if (!authIsLoading && currentUser) {
  //     router.replace('/');
  //   }
  // }, [currentUser, authIsLoading, router]);
  // if (authIsLoading || (!authIsLoading && currentUser)) {
  //   return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  // }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
       <div className="absolute top-8 left-8 flex items-center gap-3">
          <Image src="https://placehold.co/50x50.png?text=MS" alt="MenuSage Logo" width={50} height={50} className="rounded-lg" data-ai-hint="app logo" />
          <h1 className="text-3xl font-headline font-bold text-primary">SODISEN</h1>
        </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <KeyRound className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl font-headline">Connexion</CardTitle>
          <CardDescription className="font-body">
            Veuillez entrer votre code PIN personnel pour accéder à l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 font-body">
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Code PIN</FormLabel>
                    <FormControl>
                      <Input
                        type="password" 
                        placeholder="••••"
                        className="text-center text-2xl h-14 tracking-[0.5em]"
                        maxLength={6} // Assuming PINs are relatively short
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm font-medium text-destructive text-center">{error}</p>}
              <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-6 w-6" />
                    Se Connecter
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <footer className="absolute bottom-4 text-center text-xs text-muted-foreground font-body">
        &copy; {new Date().getFullYear()} Sodexo - MenuSage. Simulation de connexion.
      </footer>
    </div>
  );
}

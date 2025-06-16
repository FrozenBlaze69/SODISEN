
'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Wand2, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import { suggestMenu, type MenuSuggestionInput, type MenuSuggestionOutput } from '@/ai/flows/menuSuggestionFlow';

const suggestionFormSchema = z.object({
  dietaryNeeds: z.string().min(3, { message: "Veuillez décrire les besoins alimentaires (au moins 3 caractères)." }),
  mealType: z.enum(['starter', 'main', 'dessert'], { required_error: "Veuillez sélectionner un type de repas." }),
  preferences: z.string().optional(),
});

type SuggestionFormValues = z.infer<typeof suggestionFormSchema>;

export default function AiMenuSuggestionPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<MenuSuggestionOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionFormSchema),
    defaultValues: {
      dietaryNeeds: '',
      mealType: undefined,
      preferences: '',
    },
  });

  const onSubmit: SubmitHandler<SuggestionFormValues> = async (data) => {
    setIsSubmitting(true);
    setSuggestion(null);
    try {
      const result = await suggestMenu(data);
      if (result && result.suggestedDishName !== "Suggestion non disponible") {
        setSuggestion(result);
        toast({
          title: "Suggestion de menu générée !",
          description: "L'IA a proposé une idée de plat.",
        });
      } else {
        throw new Error(result?.description || "L'IA n'a pas pu générer de suggestion.");
      }
    } catch (error) {
      console.error("Menu suggestion error:", error);
      let errorMessage = "Une erreur est survenue lors de la génération de la suggestion.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        variant: "destructive",
        title: "Échec de la suggestion",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Brain className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-headline font-semibold text-foreground">
            Suggestion de Menu par IA
          </h1>
        </div>
        

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-accent" />
              Vos Critères pour la Suggestion
            </CardTitle>
            <CardDescription className="font-body">
              Décrivez les besoins et préférences pour que l'IA vous propose une idée de plat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 font-body">
                <FormField
                  control={form.control}
                  name="dietaryNeeds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Besoins Alimentaires Spécifiques</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Végétarien, sans sel, texture mixée, diabétique..."
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Soyez aussi précis que possible.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de Repas</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir le type de plat" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="starter">Entrée</SelectItem>
                          <SelectItem value="main">Plat Principal</SelectItem>
                          <SelectItem value="dessert">Dessert</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Préférences Gustatives (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Aime les agrumes, n'aime pas la coriandre, préfère les plats chauds..."
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Obtenir une Suggestion
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {suggestion && (
          <Card className="mt-8 bg-accent/10 border-accent">
            <CardHeader>
              <CardTitle className="font-headline text-primary flex items-center gap-2">
                <Brain className="h-6 w-6" />
                Suggestion de l'IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-body">
              <h3 className="text-xl font-semibold">{suggestion.suggestedDishName}</h3>
              <p className="text-sm text-foreground/90">{suggestion.description}</p>
              {suggestion.reasoning && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Justification :</p>
                  <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

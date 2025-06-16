
'use server';
/**
 * @fileOverview Un agent IA pour suggérer des plats de menu.
 *
 * - suggestMenu - Une fonction qui gère la suggestion de menu.
 * - MenuSuggestionInput - Le type d'entrée pour la fonction suggestMenu.
 * - MenuSuggestionOutput - Le type de retour pour la fonction suggestMenu.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { MenuSuggestionInput, MenuSuggestionOutput } from '@/types';

const MenuSuggestionInputSchema = z.object({
  dietaryNeeds: z.string().describe("Les besoins alimentaires spécifiques, ex: 'Végétarien, sans gluten'."),
  mealType: z.enum(['starter', 'main', 'dessert']).describe("Le type de repas pour lequel la suggestion est demandée: 'starter', 'main', ou 'dessert'."),
  preferences: z.string().optional().describe("Préférences supplémentaires, ex: 'aime les plats épicés, n'aime pas les champignons'."),
});

const MenuSuggestionOutputSchema = z.object({
  suggestedDishName: z.string().describe("Le nom du plat suggéré."),
  description: z.string().describe("Une brève description du plat suggéré."),
  reasoning: z.string().optional().describe("Pourquoi ce plat correspond aux critères (optionnel)."),
});

// Exporter les types inférés pour une utilisation facile dans le front-end
export type { MenuSuggestionInput, MenuSuggestionOutput };


export async function suggestMenu(input: MenuSuggestionInput): Promise<MenuSuggestionOutput> {
  return menuSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'menuSuggestionPrompt',
  input: { schema: MenuSuggestionInputSchema },
  output: { schema: MenuSuggestionOutputSchema },
  prompt: `
    Tu es un assistant culinaire expert en création de menus pour des établissements de soins (EHPAD).
    Ta tâche est de suggérer un nom de plat, une description, et optionnellement une courte justification
    basée sur les contraintes fournies.

    Contraintes :
    - Besoins alimentaires : {{{dietaryNeeds}}}
    - Type de repas : {{{mealType}}}
    {{#if preferences}}
    - Préférences additionnelles : {{{preferences}}}
    {{/if}}

    Propose un plat adapté. Sois créatif mais réaliste pour un contexte d'EHPAD.
    Par exemple, si on te demande un dessert pour quelqu'un qui a besoin de "sans sucre ajouté" et aime les fruits,
    tu pourrais suggérer "Salade de fruits frais de saison" avec une description comme "Un mélange rafraîchissant de fruits frais, naturellement sucré et plein de vitamines."
    et comme raisonnement "Ce dessert est naturellement sucré, léger et correspond aux préférences pour les fruits."
    
    Réponds uniquement avec le JSON structuré.
  `,
});

const menuSuggestionFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: MenuSuggestionInputSchema,
    outputSchema: MenuSuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        // Gérer le cas où la sortie est undefined, bien que definePrompt devrait garantir un output
        // ou lever une erreur si la génération échoue ou si le format de sortie n'est pas respecté.
        // Pour la robustesse, nous pourrions retourner une valeur par défaut ou lever une erreur plus spécifique.
        console.error("La génération du prompt n'a pas retourné de sortie.");
        return {
            suggestedDishName: "Suggestion non disponible",
            description: "Une erreur est survenue lors de la génération de la suggestion.",
            reasoning: "Le modèle n'a pas pu traiter la demande."
        };
    }
    return output;
  }
);


'use server';

import { z } from 'zod';
import * as XLSX from 'xlsx';
import type { Meal, WeeklyDayPlan, PlannedMealItem, DailyPlannedMeals, MealReservationFormData } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

// Schéma pour une ligne dans le fichier Excel de planning hebdomadaire
const ExcelWeeklyPlanRowSchema = z.object({
  'Date': z.string().refine(val => {
    try {
      // Attempt to parse common date formats, Excel often gives serial dates or pre-formatted strings
      if (!isNaN(Number(val))) { // Check if it's an Excel serial date number
        const date = XLSX.SSF.parse_date_code(Number(val));
        return isValid(new Date(date.y, date.m - 1, date.d));
      }
      // Check for YYYY-MM-DD or DD/MM/YYYY or other common string formats
      return isValid(parseISO(val)) || isValid(new Date(val.split('/').reverse().join('-')));
    } catch {
      return false;
    }
  }, { message: "Date invalide. Utilisez YYYY-MM-DD ou un format reconnu par Excel." }),
  'Jour': z.string().optional(), // Peut être dérivé de la Date
  'TypeRepas': z.enum(['Déjeuner', 'Dîner'], { message: "TypeRepas doit être 'Déjeuner' ou 'Dîner'." }),
  'RolePlat': z.enum(['Principal', 'Dessert', 'Entree', 'Entrée'], { message: "RolePlat doit être 'Principal', 'Dessert' ou 'Entree/Entrée'." }), // Accepter Entree et Entrée
  'NomPlat': z.string().min(1, { message: "Le nom du plat est requis." }),
  'CategoriePlat': z.enum(['starter', 'main', 'dessert', 'drink', 'snack'], { message: "Catégorie de plat invalide." }),
  'TagsRegime': z.string().optional(),
  'TagsAllergene': z.string().optional(),
  'DescriptionPlat': z.string().optional(),
});


const FileUploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  menuData: z.array(z.custom<WeeklyDayPlan>()).optional(), 
});

export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;

function excelSerialDateToJSDate(serial: number) {
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}


export async function handleMenuUpload(formData: FormData): Promise<FileUploadResponse> {
  const file = formData.get('menuFile') as File;

  if (!file) {
    return { success: false, message: 'Aucun fichier reçu.' };
  }

  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    return { success: false, message: 'Type de fichier invalide. Seuls les fichiers .xlsx et .xls sont acceptés.' };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true }); 
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, message: 'Le fichier Excel est vide ou ne contient pas de feuilles.' };
    }
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd'}); 

    const weeklyPlans: Record<string, WeeklyDayPlan> = {};
    const errors: string[] = [];

    jsonData.forEach((row: any, index) => {
      if (typeof row['Date'] === 'number') {
          row['Date'] = format(excelSerialDateToJSDate(row['Date']), 'yyyy-MM-dd');
      } else if (row['Date'] instanceof Date) {
          row['Date'] = format(row['Date'], 'yyyy-MM-dd');
      }
      if (typeof row['Date'] === 'string' && row['Date'].includes('/')) {
        const parts = row['Date'].split('/');
        if (parts.length === 3) {
          row['Date'] = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const validationResult = ExcelWeeklyPlanRowSchema.safeParse(row);
      if (validationResult.success) {
        const data = validationResult.data;
        const dateStr = data['Date']; 
        
        if (!weeklyPlans[dateStr]) {
          let dayOfWeek = data['Jour'];
          if (!dayOfWeek) {
             try {
                dayOfWeek = format(parseISO(dateStr), 'EEEE', { locale: fr }); 
             } catch (e) {
                errors.push(`Ligne ${index + 2}: Jour non fourni et date '${dateStr}' non parsable pour déduire le jour.`);
                return;
             }
          }
          weeklyPlans[dateStr] = {
            date: dateStr,
            dayOfWeek: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
            meals: { lunch: {}, dinner: {} },
          };
        }

        const plannedMeal: PlannedMealItem = {
          name: data.NomPlat,
          category: data.CategoriePlat,
          dietTags: data.TagsRegime?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
          allergenTags: data.TagsAllergene?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
          description: data.DescriptionPlat,
        };

        const mealSlot = data.TypeRepas === 'Déjeuner' ? weeklyPlans[dateStr].meals.lunch : weeklyPlans[dateStr].meals.dinner;
        const role = data.RolePlat.toLowerCase();

        if (role === 'principal') mealSlot.main = plannedMeal;
        else if (role === 'dessert') mealSlot.dessert = plannedMeal;
        else if (role === 'entree' || role === 'entrée') mealSlot.starter = plannedMeal;

      } else {
        errors.push(`Ligne ${index + 2} (${JSON.stringify(row)}): ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
      }
    });

    if (errors.length > 0) {
        return { 
            success: false, 
            message: `Erreurs de validation dans le fichier Excel:\n${errors.join('\n')}`,
            fileName: file.name,
            fileSize: file.size,
        };
    }
    
    const finalWeeklyPlanArray = Object.values(weeklyPlans).sort((a, b) => a.date.localeCompare(b.date));

    if (finalWeeklyPlanArray.length === 0 && jsonData.length > 0) {
        return {
            success: false,
            message: "Aucun plat valide n'a pu être extrait du fichier pour former un planning. Vérifiez les noms des colonnes: 'Date', 'TypeRepas', 'RolePlat', 'NomPlat', 'CategoriePlat'.",
            fileName: file.name,
            fileSize: file.size,
        };
    }
    
    if (finalWeeklyPlanArray.length === 0) {
        return {
            success: false,
            message: "Aucun plat trouvé dans le fichier Excel. La feuille est peut-être vide ou mal formatée.",
            fileName: file.name,
            fileSize: file.size,
        };
    }

    return {
      success: true,
      message: `Le fichier "${file.name}" a été importé avec succès. ${finalWeeklyPlanArray.length} jour(s) de menu chargé(s).`,
      fileName: file.name,
      fileSize: file.size,
      menuData: finalWeeklyPlanArray,
    };

  } catch (error) {
    console.error('Error parsing Excel file:', error);
    let errorMessage = 'Erreur lors du traitement du fichier Excel.';
    if (error instanceof Error) {
        errorMessage += ` Détail: ${error.message}`;
    }
    return { success: false, message: errorMessage };
  }
}

// Schéma pour la réservation de repas
const MealReservationFormSchema = z.object({
  residentId: z.string().min(1, "Veuillez sélectionner un résident."),
  mealDate: z.date({
    required_error: "La date du repas est requise.",
    invalid_type_error: "Format de date invalide.",
  }),
  mealType: z.enum(['lunch', 'dinner'], {
    required_error: "Le type de repas est requis.",
  }),
  numberOfGuests: z.coerce.number().min(0, "Le nombre d'invités doit être positif ou nul.").int("Le nombre d'invités doit être un nombre entier."),
  comments: z.string().optional(),
});

export async function handleMealReservation(
  data: MealReservationFormData
): Promise<{ success: boolean; message: string; reservationDetails?: any }> {
  const validationResult = MealReservationFormSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      success: false,
      message: "Données de réservation invalides: " + validationResult.error.flatten().fieldErrors,
    };
  }

  const { residentId, mealDate, mealType, numberOfGuests, comments } = validationResult.data;

  // TODO: Remplacer par une vraie sauvegarde Firestore
  // Pour l'instant, on simule la sauvegarde et on logue les données
  const reservationDetailsToSave = {
    residentId,
    mealDate: format(mealDate, 'yyyy-MM-dd'), // Formater la date pour la sauvegarde/log
    mealType,
    numberOfGuests,
    comments: comments || '',
    reservedBy: "CURRENT_USER_PLACEHOLDER", // À remplacer par l'ID/nom de l'utilisateur connecté
    createdAt: new Date().toISOString(), // Simuler un timestamp
  };

  console.log("Tentative de sauvegarde de la réservation :", reservationDetailsToSave);

  // Simulation d'une sauvegarde réussie
  // Dans un cas réel, vous appelleriez ici une fonction pour écrire dans Firestore
  // et vous géreriez les erreurs potentielles de cette écriture.

  // const reservationId = await saveReservationToFirestore(reservationDetailsToSave);

  return {
    success: true,
    message: `Réservation pour ${numberOfGuests} invité(s) le ${format(mealDate, 'dd/MM/yyyy')} (${mealType === 'lunch' ? 'Déjeuner' : 'Dîner'}) enregistrée avec succès.`,
    reservationDetails: reservationDetailsToSave,
  };
}

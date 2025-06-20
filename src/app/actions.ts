
'use server';

import { z } from 'zod';
import * as XLSX from 'xlsx';
import type { WeeklyDayPlan, PlannedMealItem, MealReservation } from '@/types';
import { format, parseISO, isValid, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { RESERVATIONS_COLLECTION } from '@/lib/firebase/constants';

const ExcelDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { 
  message: "La date doit être au format YYYY-MM-DD après la conversion interne." 
});

const ExcelWeeklyPlanRowSchema = z.object({
  'Date': ExcelDateStringSchema,
  'Jour': z.string().optional(), 
  'TypeRepas': z.enum(['Déjeuner', 'Dîner'], { message: "TypeRepas doit être 'Déjeuner' ou 'Dîner'." }),
  'RolePlat': z.enum(['Principal', 'Dessert', 'Entree', 'Entrée'], { message: "RolePlat doit être 'Principal', 'Dessert' ou 'Entree/Entrée'." }),
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
    return new Date(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate());
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
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false, dateNF: 'yyyy-mm-dd' }); 
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, message: 'Le fichier Excel est vide ou ne contient pas de feuilles.' };
    }
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true }); 

    const weeklyPlans: Record<string, WeeklyDayPlan> = {};
    const errors: string[] = [];

    jsonData.forEach((row: any, index) => {
      let processedDateValue: any = row['Date'];
      let successfullyProcessedDateString: string | undefined = undefined;

      if (typeof processedDateValue === 'number') { 
          const jsDate = excelSerialDateToJSDate(processedDateValue);
          if (isValid(jsDate)) {
            successfullyProcessedDateString = format(jsDate, 'yyyy-MM-dd');
          }
      } else if (processedDateValue instanceof Date) { 
          if (isValid(processedDateValue)) {
            successfullyProcessedDateString = format(processedDateValue, 'yyyy-MM-dd');
          }
      } else if (typeof processedDateValue === 'string') {
          let parsedDate: Date | undefined;
          if (/^\d{4}-\d{2}-\d{2}$/.test(processedDateValue)) {
            parsedDate = parseISO(processedDateValue);
          } else {
            if (processedDateValue.includes('/')) {
                parsedDate = parse(processedDateValue, 'dd/MM/yyyy', new Date());
                if (!isValid(parsedDate)) {
                    parsedDate = parse(processedDateValue, 'MM/dd/yyyy', new Date());
                }
                 if (!isValid(parsedDate)) {
                    parsedDate = parse(processedDateValue, 'd/M/yyyy', new Date());
                }
                if (!isValid(parsedDate)) {
                    parsedDate = parse(processedDateValue, 'M/d/yyyy', new Date());
                }
            }
            if (!isValid(parsedDate)) {
                const genericParsed = new Date(processedDateValue);
                if (genericParsed.toString() !== 'Invalid Date') {
                   parsedDate = genericParsed;
                }
            }
          }

          if (parsedDate && isValid(parsedDate)) {
            successfullyProcessedDateString = format(parsedDate, 'yyyy-MM-dd');
          } else {
            successfullyProcessedDateString = processedDateValue;
          }
      }
      
      const rowForValidation = { ...row, 'Date': successfullyProcessedDateString };
      const validationResult = ExcelWeeklyPlanRowSchema.safeParse(rowForValidation);
      
      if (validationResult.success) {
        const data = validationResult.data;
        const dateStr = data.Date; 
        
        if (!weeklyPlans[dateStr]) {
          let dayOfWeek = data.Jour;
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
        errors.push(`Ligne ${index + 2} (Date originale: '${row['Date']}', Date traitée: '${successfullyProcessedDateString || 'N/A'}'): ${validationResult.error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`);
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
            message: "Aucun plat valide n'a pu être extrait du fichier pour former un planning. Vérifiez les noms des colonnes: 'Date', 'TypeRepas', 'RolePlat', 'NomPlat', 'CategoriePlat' et le format des dates.",
            fileName: file.name,
            fileSize: file.size,
        };
    }
    
    if (finalWeeklyPlanArray.length === 0) {
        return {
            success: false,
            message: "Aucun plat trouvé dans le fichier Excel. La feuille est peut-être vide ou mal formatée (dates non reconnues, etc.).",
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

const MealReservationServerSchema = z.object({
  residentName: z.string().min(1, "Le nom du résident est requis."),
  mealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La date doit être au format AAAA-MM-JJ."),
  mealType: z.enum(['lunch', 'dinner'], {
    required_error: "Le type de repas est requis.",
  }),
  numberOfGuests: z.coerce.number().min(0, "Le nombre d'invités doit être positif ou nul.").int("Le nombre d'invités doit être un nombre entier."),
  comments: z.string().optional(),
});

type ServerActionReservationData = z.infer<typeof MealReservationServerSchema>;

export async function handleMealReservation(
  data: ServerActionReservationData
): Promise<{ success: boolean; message: string; reservationDetails?: MealReservation }> {
  const validationResult = MealReservationServerSchema.safeParse(data);

  if (!validationResult.success) {
    const formattedErrors = Object.entries(validationResult.error.flatten().fieldErrors)
      .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
      .join('\n');
    return {
      success: false,
      message: "Données de réservation invalides: \n" + formattedErrors,
    };
  }

  const { residentName, mealDate, mealType, numberOfGuests, comments } = validationResult.data;

  try {
    const reservationDataToSave = {
      residentName,
      mealDate, // This is already 'YYYY-MM-DD' string
      mealType,
      numberOfGuests,
      comments: comments || '',
      reservedBy: "CURRENT_USER_PLACEHOLDER", // Replace with actual user in a real auth system
      createdAt: serverTimestamp(), // Firestore server timestamp
    };

    const docRef = await addDoc(collection(db, RESERVATIONS_COLLECTION), reservationDataToSave);
    
    // For the response, we need to simulate what the structure would be like with an ISO string for createdAt
    // In a real scenario, you might fetch the doc again, but for now, a client-side generated date is fine for the immediate response
    // The listener will get the actual Firestore timestamp converted.
    const nowISO = new Date().toISOString();

    let displayDate = mealDate;
    try {
      displayDate = format(parseISO(mealDate), 'dd/MM/yyyy', { locale: fr });
    } catch (e) {
      console.error("Error parsing mealDate for display in success message:", e);
    }
    
    return {
      success: true,
      message: `Réservation pour ${residentName} et ${numberOfGuests} invité(s) le ${displayDate} (${mealType === 'lunch' ? 'Déjeuner' : 'Dîner'}) enregistrée avec succès dans la base de données.`,
      reservationDetails: {
        id: docRef.id,
        ...validationResult.data, // Use validated data
        comments: validationResult.data.comments || '',
        reservedBy: "CURRENT_USER_PLACEHOLDER",
        createdAt: nowISO, // Temporary, listener will provide actual
      },
    };

  } catch (error) {
    console.error("Error saving reservation to Firestore: ", error);
    let errorMessage = "Erreur lors de la sauvegarde de la réservation dans la base de données.";
    if (error instanceof Error) {
        errorMessage += ` Détail: ${error.message}. Vérifiez les règles de sécurité Firestore pour la collection '${RESERVATIONS_COLLECTION}'.`;
    }
    return { success: false, message: errorMessage };
  }
}

export async function deleteReservationFromFirestore(reservationId: string): Promise<{ success: boolean; message: string }> {
  if (!reservationId) {
    return { success: false, message: "ID de réservation manquant." };
  }
  try {
    await deleteDoc(doc(db, RESERVATIONS_COLLECTION, reservationId));
    return { success: true, message: "Réservation supprimée avec succès de la base de données." };
  } catch (error) {
    console.error("Error deleting reservation from Firestore: ", error);
    let errorMessage = "Erreur lors de la suppression de la réservation de la base de données.";
     if (error instanceof Error) {
        errorMessage += ` Détail: ${error.message}.`;
    }
    return { success: false, message: errorMessage };
  }
}

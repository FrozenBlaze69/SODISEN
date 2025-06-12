
'use server';

import { z } from 'zod';
import * as XLSX from 'xlsx';
import type { Meal } from '@/types';

// Schema for a row in the Excel file
const ExcelRowSchema = z.object({
  'Nom du Plat': z.string().min(1, { message: "Le nom du plat est requis." }),
  'Catégorie': z.enum(['starter', 'main', 'dessert', 'drink', 'snack'], { message: "Catégorie invalide." }),
  'Tags Régime': z.string().optional(),
  'Tags Allergène': z.string().optional(),
  'Description': z.string().optional(), // Optional description column
});

// Schema for the Meal object, consistent with src/types/index.ts
const MealSchemaForResponse = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['starter', 'main', 'dessert', 'drink', 'snack']),
  dietTags: z.array(z.string()).optional(),
  allergenTags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

const FileUploadResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  menuData: z.array(MealSchemaForResponse).optional(),
});

export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>;

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
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, message: 'Le fichier Excel est vide ou ne contient pas de feuilles.' };
    }
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const parsedMeals: Meal[] = [];
    const errors: string[] = [];

    jsonData.forEach((row, index) => {
      const validationResult = ExcelRowSchema.safeParse(row);
      if (validationResult.success) {
        const data = validationResult.data;
        parsedMeals.push({
          id: `meal-${Date.now()}-${index}`, // Simple unique ID
          name: data['Nom du Plat'],
          category: data['Catégorie'],
          dietTags: data['Tags Régime']?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
          allergenTags: data['Tags Allergène']?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
          description: data['Description'],
        });
      } else {
        errors.push(`Ligne ${index + 2}: ${validationResult.error.errors.map(e => e.message).join(', ')}`);
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
    
    if (parsedMeals.length === 0 && jsonData.length > 0) {
        return {
            success: false,
            message: "Aucun plat valide n'a pu être extrait du fichier. Vérifiez les noms des colonnes: 'Nom du Plat', 'Catégorie', 'Tags Régime', 'Tags Allergène', 'Description'.",
            fileName: file.name,
            fileSize: file.size,
        };
    }
    
    if (parsedMeals.length === 0) {
        return {
            success: false,
            message: "Aucun plat trouvé dans le fichier Excel. La feuille est peut-être vide ou mal formatée.",
            fileName: file.name,
            fileSize: file.size,
        };
    }


    return {
      success: true,
      message: `Le fichier "${file.name}" a été importé avec succès. ${parsedMeals.length} plat(s) chargé(s).`,
      fileName: file.name,
      fileSize: file.size,
      menuData: parsedMeals,
    };

  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return { success: false, message: 'Erreur lors du traitement du fichier Excel.' };
  }
}

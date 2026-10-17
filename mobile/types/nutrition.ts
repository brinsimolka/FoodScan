export interface MealPreview {
  foodName: string;
  brand?: string;
  servingSizeGrams: number | null;
  calories: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  aiConfidence?: number;
  aiRawItems?: { label: string; estimatedGrams: number }[];
  notes?: string;
}

export interface ScanResult {
  source: "barcode" | "photo";
  preview: MealPreview;
}

export interface Totals {
  calories: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
}

export interface LoggedMeal {
  id: number;
  loggedAt: string;
  source: "barcode" | "photo";
  foodName: string;
  calories: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  photo: string | null;
}

import api, { setToken } from "./api";
import type { MealPreview, LoggedMeal, ScanResult, User } from "../types/nutrition";

export async function register(name: string, email: string, password: string, photo: string | null): Promise<User> {
  const { data } = await api.post("/auth/register", { name, email, password, photo });
  await setToken(data.token);
  return data.user;
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post("/auth/login", { email, password });
  await setToken(data.token);
  return data.user;
}

export async function updatePhoto(photo: string | null): Promise<User> {
  const { data } = await api.put("/auth/photo", { photo });
  return data.user;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export async function scanBarcode(barcode: string): Promise<ScanResult> {
  const { data } = await api.post("/scan-barcode", { barcode });
  return { source: "barcode", preview: data.preview };
}

export async function scanPhoto(uri: string): Promise<ScanResult> {
  const form = new FormData();
  form.append("photo", { uri, name: "meal.jpg", type: "image/jpeg" } as any);
  const { data } = await api.post("/scan-photo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { source: "photo", preview: data.preview };
}

export async function logMeal(p: {
  source: "barcode" | "photo";
  preview: MealPreview;
  portionMultiplier: number;
}) {
  await api.post("/meals", {
    source: p.source,
    portionMultiplier: p.portionMultiplier,
    foodName: p.preview.foodName,
    calories: p.preview.calories,
    carbsG: p.preview.carbsG,
    proteinG: p.preview.proteinG,
    fatG: p.preview.fatG,
  });
}

export async function getMeals(): Promise<LoggedMeal[]> {
  const { data } = await api.get("/meals");
  return data.meals;
}

export async function deleteMeal(id: number) {
  await api.delete(`/meals/${id}`);
}

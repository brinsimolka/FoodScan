import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";

export type Lang = "fr" | "en" | "ar";
export const LANGS: { key: Lang; label: string }[] = [
  { key: "fr", label: "FR" },
  { key: "en", label: "EN" },
  { key: "ar", label: "عربي" },
];

const dict = {
  fr: {
    login: "Connexion", signup: "Créer un compte", loginBtn: "Se connecter", signupBtn: "S'inscrire",
    noAccount: "Pas de compte ? S'inscrire", haveAccount: "Déjà un compte ? Se connecter",
    name: "Nom", email: "Email", password: "Mot de passe", 
    
    
    
    
    profilePhoto: "Photo de profil (facultatif)", addPhoto: "Ajouter une photo", changePhoto: "Changer la photo", removePhoto: "Retirer la photo",
    errCreds: "Email ou mot de passe incorrect.", errTaken: "Cet email est déjà utilisé.",
    errShort: "Le mot de passe doit contenir au moins 6 caractères.", errInput: "Nom ou email invalide.",
    errGeneric: "Une erreur est survenue.",
    errServer: "Serveur injoignable : vérifie l'IP dans services/api.ts",
    hello: "Salut", itemsToday: "aliment(s) aujourd'hui", today: "Aujourd'hui", yesterday: "Hier",
    kcal: "kcal", carbs: "glucides", protein: "protéines", fat: "lipides",
    scanFood: "Scanner un aliment", history: "Historique", refresh: "Rafraîchir", logout: "Se déconnecter",
    logoutAsk: "Veux-tu vraiment te déconnecter ?", language: "Langue", back: "Retour",
    historyEmpty: "Aucun aliment enregistré pour l'instant.", serverDown: "Serveur injoignable.",
    delete: "Supprimer", cancel: "Annuler", deleteAsk: "Supprimer cet aliment de l'historique ?",
    errDelete: "Impossible de supprimer cet aliment.", barcode: "code-barres", photo: "photo",
    camNeeded: "La caméra est nécessaire pour scanner un aliment.", allowCam: "Autoriser la caméra",
    tabBarcode: "Code-barres", tabPhoto: "Photo du repas", frameHint: "Cadre le code-barres dans le rectangle",
    searching: "Recherche du produit…", analyzing: "Analyse du repas…",
    notFound: "Produit introuvable", notFoundMsg: "Ce produit n'est pas dans la base. Essaie la photo.",
    error: "Erreur", errBarcode: "Impossible de lire ce code-barres.", errPhoto: "Impossible d'analyser cette photo, réessaie.",
    aiConf: "Confiance IA", portion: "Portion consommée", calories: "Calories", ateQ: "Tu as mangé ça ?",
    yes: "Oui, je l'ai mangé", no: "Non, ne pas ajouter", saving: "Enregistrement…", errSave: "Impossible d'enregistrer cet aliment.",
    glucides: "Glucides", proteines: "Protéines", lipides: "Lipides",
  },
  en: {
    login: "Sign in", signup: "Create an account", loginBtn: "Sign in", signupBtn: "Sign up",
    noAccount: "No account? Sign up", haveAccount: "Already have an account? Sign in",
    name: "Name", email: "Email", password: "Password", 
    
    
    
    
    profilePhoto: "Profile photo (optional)", addPhoto: "Add a photo", changePhoto: "Change photo", removePhoto: "Remove photo",
    errCreds: "Wrong email or password.", errTaken: "This email is already used.",
    errShort: "Password must be at least 6 characters.", errInput: "Invalid name or email.",
    errGeneric: "Something went wrong.",
    errServer: "Server unreachable: check the IP in services/api.ts",
    hello: "Hi", itemsToday: "item(s) today", today: "Today", yesterday: "Yesterday",
    kcal: "kcal", carbs: "carbs", protein: "protein", fat: "fat",
    scanFood: "Scan a food", history: "History", refresh: "Refresh", logout: "Sign out",
    logoutAsk: "Do you really want to sign out?", language: "Language", back: "Back",
    historyEmpty: "No food logged yet.", serverDown: "Server unreachable.",
    delete: "Delete", cancel: "Cancel", deleteAsk: "Delete this item from history?",
    errDelete: "Couldn't delete this item.", barcode: "barcode", photo: "photo",
    camNeeded: "The camera is needed to scan food.", allowCam: "Allow camera",
    tabBarcode: "Barcode", tabPhoto: "Meal photo", frameHint: "Put the barcode inside the frame",
    searching: "Looking up product…", analyzing: "Analyzing meal…",
    notFound: "Product not found", notFoundMsg: "This product isn't in the database. Try the photo.",
    error: "Error", errBarcode: "Couldn't read this barcode.", errPhoto: "Couldn't analyze this photo, try again.",
    aiConf: "AI confidence", portion: "Portion eaten", calories: "Calories", ateQ: "Did you eat this?",
    yes: "Yes, I ate it", no: "No, don't add it", saving: "Saving…", errSave: "Couldn't save this item.",
    glucides: "Carbs", proteines: "Protein", lipides: "Fat",
  },
  ar: {
    login: "تسجيل الدخول", signup: "إنشاء حساب", loginBtn: "دخول", signupBtn: "تسجيل",
    noAccount: "ليس لديك حساب؟ سجّل", haveAccount: "لديك حساب؟ سجّل الدخول",
    name: "الاسم", email: "البريد الإلكتروني", password: "كلمة المرور", 
    
    
    
    
    profilePhoto: "صورة الملف الشخصي (اختياري)", addPhoto: "إضافة صورة", changePhoto: "تغيير الصورة", removePhoto: "حذف الصورة",
    errCreds: "البريد أو كلمة المرور غير صحيحة.", errTaken: "هذا البريد مستخدم بالفعل.",
    errShort: "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.", errInput: "الاسم أو البريد غير صالح.",
    errGeneric: "حدث خطأ ما.",
    errServer: "تعذّر الوصول إلى الخادم: تحقق من العنوان في services/api.ts",
    hello: "مرحبًا", itemsToday: "عنصر اليوم", today: "اليوم", yesterday: "أمس",
    kcal: "سعرة", carbs: "كربوهيدرات", protein: "بروتين", fat: "دهون",
    scanFood: "مسح طعام", history: "السجل", refresh: "تحديث", logout: "تسجيل الخروج",
    logoutAsk: "هل تريد فعلاً تسجيل الخروج؟", language: "اللغة", back: "رجوع",
    historyEmpty: "لا يوجد طعام مسجّل بعد.", serverDown: "تعذّر الوصول إلى الخادم.",
    delete: "حذف", cancel: "إلغاء", deleteAsk: "حذف هذا العنصر من السجل؟",
    errDelete: "تعذّر حذف هذا العنصر.", barcode: "باركود", photo: "صورة",
    camNeeded: "الكاميرا مطلوبة لمسح الطعام.", allowCam: "السماح بالكاميرا",
    tabBarcode: "باركود", tabPhoto: "صورة الوجبة", frameHint: "ضع الباركود داخل الإطار",
    searching: "جارٍ البحث عن المنتج…", analyzing: "جارٍ تحليل الوجبة…",
    notFound: "المنتج غير موجود", notFoundMsg: "هذا المنتج غير موجود في القاعدة. جرّب الصورة.",
    error: "خطأ", errBarcode: "تعذّرت قراءة هذا الباركود.", errPhoto: "تعذّر تحليل الصورة، حاول مجددًا.",
    aiConf: "ثقة الذكاء الاصطناعي", portion: "الكمية المتناولة", calories: "السعرات", ateQ: "هل أكلت هذا؟",
    yes: "نعم، أكلته", no: "لا، لا تضفه", saving: "جارٍ الحفظ…", errSave: "تعذّر حفظ هذا العنصر.",
    glucides: "كربوهيدرات", proteines: "بروتين", lipides: "دهون",
  },
} as const;

export type Key = keyof typeof dict.fr;
const LANG_KEY = "foodscan_lang";
const LOCALES: Record<Lang, string> = { fr: "fr-FR", en: "en-GB", ar: "ar" };

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
  rtl: boolean;
  row: "row" | "row-reverse";
  ta: "left" | "right";
  locale: string;
}
const I18nContext = createContext<Ctx>(null as any);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    SecureStore.getItemAsync(LANG_KEY).then((v) => {
      if (v === "fr" || v === "en" || v === "ar") setLangState(v);
    }).catch(() => {});
  }, []);

  const value = useMemo<Ctx>(() => {
    const rtl = lang === "ar";
    return {
      lang,
      setLang: (l) => { setLangState(l); SecureStore.setItemAsync(LANG_KEY, l).catch(() => {}); },
      t: (k) => dict[lang][k] ?? dict.fr[k],
      rtl,
      row: rtl ? "row-reverse" : "row",
      ta: rtl ? "right" : "left",
      locale: LOCALES[lang],
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

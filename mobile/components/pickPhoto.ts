import * as ImagePicker from "expo-image-picker";

/** Ouvre la galerie et renvoie une petite image carrée en data URI (ou null si annulé). */
export async function pickPhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.3, base64: true,
  });
  if (r.canceled || !r.assets[0]?.base64) return null;
  return `data:image/jpeg;base64,${r.assets[0].base64}`;
}

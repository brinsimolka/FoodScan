import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { scanBarcode, scanPhoto } from "../services/nutritionApi";
import { useI18n } from "../i18n";
import { C } from "../theme";
import type { ScanResult } from "../types/nutrition";

type Mode = "barcode" | "photo";

export default function ScanScreen({
  onResult,
  onCancel,
}: {
  onResult: (r: ScanResult) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<Mode>("barcode");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false); // évite de traiter 20 fois le même code-barres
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View style={s.center}><ActivityIndicator /></View>;

  if (!permission.granted) {
    return (
      <View style={s.center}>
        <Text style={s.permText}>{t("camNeeded")}</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnText}>{t("allowCam")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={{ marginTop: 16 }}>
          <Text style={{ color: C.primaryDark }}>{t("back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onBarcode = async (r: BarcodeScanningResult) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      onResult(await scanBarcode(r.data));
    } catch (e: any) {
      const notFound = e?.response?.status === 404;
      Alert.alert(
        notFound ? t("notFound") : t("error"),
        notFound ? t("notFoundMsg") : t("errBarcode")
      );
      setTimeout(() => { locked.current = false; }, 1500);
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new Error("photo vide");
      onResult(await scanPhoto(photo.uri));
    } catch {
      Alert.alert(t("error"), t("errPhoto"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={mode === "barcode" ? { barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] } : undefined}
        onBarcodeScanned={mode === "barcode" ? onBarcode : undefined}
      />

      {mode === "barcode" && (
        <View style={s.frameWrap} pointerEvents="none">
          <View style={s.frame} />
          <Text style={s.hint}>{t("frameHint")}</Text>
        </View>
      )}

      {busy && (
        <View style={s.busy}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={s.busyText}>{mode === "photo" ? t("analyzing") : t("searching")}</Text>
        </View>
      )}

      <View style={s.toggle}>
        {(["barcode", "photo"] as Mode[]).map((m) => (
          <TouchableOpacity key={m} style={[s.tBtn, mode === m && s.tBtnOn]} onPress={() => setMode(m)}>
            <Text style={[s.tText, mode === m && s.tTextOn]}>{m === "barcode" ? t("tabBarcode") : t("tabPhoto")}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.back} onPress={onCancel}>
        <Text style={s.backText}>✕</Text>
      </TouchableOpacity>

      {mode === "photo" && (
        <TouchableOpacity style={s.shutter} onPress={takePhoto} disabled={busy}>
          <View style={s.shutterIn} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const FILL = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#fff" },
  permText: { color: "#333", textAlign: "center", marginBottom: 16, fontSize: 16 },
  permBtn: { backgroundColor: "#1F9D63", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  permBtnText: { color: "#fff", fontWeight: "600" },
  frameWrap: { ...FILL, justifyContent: "center", alignItems: "center" },
  frame: { width: 260, height: 160, borderWidth: 2, borderColor: "#fff", borderRadius: 12 },
  hint: { color: "#fff", marginTop: 16, fontSize: 14 },
  busy: { ...FILL, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center" },
  busyText: { color: "#fff", marginTop: 12, fontSize: 15 },
  toggle: { position: "absolute", top: 56, alignSelf: "center", flexDirection: "row", backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 24, padding: 4 },
  tBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20 },
  tBtnOn: { backgroundColor: "#fff" },
  tText: { color: "#fff", fontWeight: "600" },
  tTextOn: { color: "#1F9D63" },
  back: { position: "absolute", top: 56, left: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  backText: { color: "#fff", fontSize: 16 },
  shutter: { position: "absolute", bottom: 44, alignSelf: "center", width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  shutterIn: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" },
});

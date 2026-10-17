import axios from "axios";
import * as SecureStore from "expo-secure-store";

/**
 * ⚠️ À MODIFIER : l'adresse IP de ton ordinateur (commande `ipconfig`, ligne "Adresse IPv4").
 * Le téléphone et l'ordinateur doivent être sur le même WiFi.
 */
const SERVER_IP = "192.168.1.24";

const TOKEN_KEY = "foodscan_token";
let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const loadToken = async () => {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
};
export const setToken = async (t: string | null) => {
  token = t;
  if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
};
export const setOnUnauthorized = (fn: () => void) => { onUnauthorized = fn; };

const api = axios.create({
  baseURL: `http://${SERVER_IP}:4000/api`,
  timeout: 35000,
});

api.interceptors.request.use((cfg) => {
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    const url: string = e?.config?.url ?? "";
    if (e?.response?.status === 401 && !url.startsWith("/auth/login") && !url.startsWith("/auth/register")) {
      onUnauthorized?.();
    }
    return Promise.reject(e);
  }
);

export default api;

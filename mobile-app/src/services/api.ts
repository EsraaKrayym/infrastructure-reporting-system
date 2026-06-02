import axios from "axios";
import { getPendingReports, removePendingReport, savePendingReport } from "./offline";

const API_URL = "http://192.168.178.30:5000/api";

// Axios Instanz mit Config
const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

// Token speichern (wird beim Login gesetzt)
let authToken = "";

export const setAuthToken = (token: string) => {
    authToken = token;
    console.log("🔐 Token gesetzt:", token?.substring(0, 20) + "...");
};

// Interceptor für automatisches Token hinzufügen
api.interceptors.request.use((config) => {
    config.headers = config.headers || {};
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
        console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        console.log(`✅ Response ${response.status}:`, response.data);
        return response;
    },
    (error) => {
        console.error(`❌ Error ${error.response?.status}:`, error.response?.data || error.message);
        throw error;
    }
);

export const loginUser = async (email: string, password: string) => {
    try {
        const res = await api.post("/auth/login", { email, password });
        if (res.data.token) {
            setAuthToken(res.data.token);
        }
        return res.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

export const registerUser = async (name: string, email: string, password: string) => {
    try {
        const res = await api.post("/auth/register", { name, email, password });
        return res.data;
    } catch (error) {
        console.error("Register error:", error);
        throw error;
    }
};

export const createReport = async (token: string, data: any) => {
    try {
        if (token && !authToken) {
            setAuthToken(token);
        }

        const isFormData = data instanceof FormData;
        if (!isFormData) {
            console.log("🚀 Creating report:");
            console.log("  Title:", data.title);
            console.log("  Category:", data.category);
            console.log("  Location:", data.latitude, data.longitude);
        } else {
            console.log("🚀 Creating report with photo/FormData");
        }

        const body = isFormData
            ? data
            : {
                  title: data.title,
                  description: data.description || "Keine Beschreibung",
                  category: data.category,
                  latitude: parseFloat(data.latitude),
                  longitude: parseFloat(data.longitude),
                  priority: data.priority || "medium",
                  address: data.address || "",
              };

        const res = await api.post("/reports", body, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error: any) {
        const isNetworkError = !error.response;
        if (isNetworkError) {
            if (data instanceof FormData) {
                console.warn("⚠️ Offline-Upload mit Foto kann nicht gespeichert werden.");
                throw new Error("Offline-Upload mit Foto ist aktuell nicht möglich. Bitte erneut senden, sobald die Verbindung wiederhergestellt ist.");
            }

            console.warn("⚠️ Offline oder Netzwerkfehler, Report wird lokal gespeichert.");
            await savePendingReport({ ...data, priority: data.priority || "medium", address: data.address || "" });
            return {
                offline: true,
                message: "Report offline gespeichert. Er wird gesendet, sobald die Verbindung wiederhergestellt ist.",
            };
        }

        console.error("❌ CREATE REPORT ERROR:");
        console.error("  Status:", error.response?.status);
        console.error("  Message:", error.response?.data?.message);
        console.error("  Error:", error.message);
        throw error;
    }
};

export const syncPendingReports = async (token: string) => {
    if (!token) return;

    const pendingReports = await getPendingReports();
    if (pendingReports.length === 0) return;

    for (const pending of pendingReports) {
        try {
            await api.post("/reports", pending.data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await removePendingReport(pending.id);
            console.log(`✅ Offline-Report synchronisiert: ${pending.id}`);
        } catch (error: any) {
            console.warn(`⚠️ Offline-Report konnte nicht synchronisiert werden: ${pending.id}`, error.message);
        }
    }
};

export const getReports = async (token: string) => {
    try {
        if (token && !authToken) {
            setAuthToken(token);
        }

        // Citizens nutzen /my um ihre eigenen Reports zu sehen
        const res = await api.get("/reports/my", {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    } catch (error: any) {
        console.error("❌ GET REPORTS ERROR:");
        console.error("  Status:", error.response?.status);
        console.error("  Message:", error.response?.data?.message);
        throw error;
    }
};

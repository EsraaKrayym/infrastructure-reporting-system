//const API_URL = "http://192.168.178.30:5000/api";
const API_URL = "https://cityreport-backend.onrender.com/api";
import { getPendingReports, removePendingReport, savePendingReport } from "./offline";

type ReportPayload = {
    title?: string;
    description?: string;
    category?: string;
    latitude?: number | string;
    longitude?: number | string;
    priority?: string;
    address?: string;
    photo?: string;
};

const getTitleFromCategory = (category?: string) => {
    switch (category) {
        case "road_damage":
            return "Straßenschäden";
        case "street_light":
            return "Beleuchtung";
        case "waste":
            return "Müll & Sauberkeit";
        case "other":
            return "Sonstiges";
        default:
            return "Infrastrukturmeldung";
    }
};

const isObjectPayload = (value: unknown): value is ReportPayload =>
    typeof value === "object" && value !== null && !(value instanceof FormData);

const buildReportRequest = (token: string, data: any) => {
    const hasPhotoUri = isObjectPayload(data) && typeof data.photo === "string" && data.photo.length > 0;

    if (data instanceof FormData || hasPhotoUri) {
        const formData = data instanceof FormData ? data : new FormData();

        if (!(data instanceof FormData) && isObjectPayload(data)) {
            formData.append("title", String(data.title ?? getTitleFromCategory(data.category)));
            formData.append("category", String(data.category ?? "road_damage"));
            formData.append("description", String(data.description ?? ""));
            formData.append("priority", String(data.priority ?? "medium"));
            formData.append("address", String(data.address ?? ""));
            formData.append("latitude", String(data.latitude ?? ""));
            formData.append("longitude", String(data.longitude ?? ""));

            if (data.photo) {
                formData.append("photo", {
                    uri: data.photo,
                    type: "image/jpeg",
                    name: "report.jpg",
                } as any);
            }
        }

        return {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        } as RequestInit;
    }

    return {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    } as RequestInit;
};

const sendReportNow = async (token: string, data: any) => {
    const res = await fetch(`${API_URL}/reports`, buildReportRequest(token, data));
    const result = await res.json();

    if (!res.ok) {
        throw new Error(result?.message || "Report konnte nicht erstellt werden");
    }

    return result;
};

const isNetworkError = (error: unknown) => {
    const message = String((error as any)?.message || "").toLowerCase();
    return (
        message.includes("network request failed") ||
        message.includes("failed to fetch") ||
        message.includes("network")
    );
};

export const loginUser = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.message || "Login fehlgeschlagen");
    }

    return data;
};

export const syncPendingReports = async (token: string) => {
    const pending = await getPendingReports();
    if (pending.length === 0) {
        return { synced: 0, remaining: 0 };
    }

    let synced = 0;

    for (const item of pending) {
        try {
            await sendReportNow(token, item.data);
            await removePendingReport(item.id);
            synced += 1;
        } catch (err) {
            if (isNetworkError(err)) {
                break;
            }
        }
    }

    const remaining = (await getPendingReports()).length;
    return { synced, remaining };
};

export const createReport = async (token: string, data: any) => {
    try {
        await syncPendingReports(token);
        return await sendReportNow(token, data);
    } catch (err) {
        if (isNetworkError(err) && isObjectPayload(data)) {
            await savePendingReport(data as Record<string, unknown>);
            return { offline: true };
        }

        throw err;
    }
};

export const getReports = async (token: string) => {
    // Sobald wieder Netz da ist, werden offene Offline-Meldungen automatisch synchronisiert.
    try {
        await syncPendingReports(token);
    } catch {
        // Ignorieren: Report-Liste soll trotzdem geladen werden, wenn möglich.
    }

    const myRes = await fetch(`${API_URL}/reports/my`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const myData = await myRes.json();

    if (myRes.ok) {
        return myData;
    }

    const res = await fetch(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.message || myData?.message || "Reports konnten nicht geladen werden");
    }

    return data;
};
export const registerUser = async (data: any) => {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    return res.json();
};

export const getCurrentUser = async (token: string) => {
    const res = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.message || "Benutzerdaten konnten nicht geladen werden");
    }

    return data;
};

export const updateCurrentUser = async (
    token: string,
    payload: { name: string; email: string; password?: string }
) => {
    const res = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.message || "Profil konnte nicht aktualisiert werden");
    }

    return data;
};
//const API_URL = "http://192.168.178.30:5000/api";
const API_URL = "https://cityreport-backend.onrender.com/api";
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

export const createReport = async (token: string, data: any) => {
    const isFormData =
        typeof FormData !== "undefined" &&
        !!data &&
        (data instanceof FormData || typeof data.append === "function");

    const res = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
        },
        body: isFormData ? data : JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
        throw new Error(result?.message || "Report konnte nicht erstellt werden");
    }

    return result;
};

export const getReports = async (token: string) => {
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
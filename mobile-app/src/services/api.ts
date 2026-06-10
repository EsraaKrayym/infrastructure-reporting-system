//const API_URL = "http://192.168.178.30:5000/api";
const API_URL = "https://cityreport-backend.onrender.com/api";
export const loginUser = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return res.json();
};

export const createReport = async (token: string, data: any) => {
    const res = await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const getReports = async (token: string) => {
    const res = await fetch(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
};
export const registerUser = (data: any) =>
    API.post("/auth/register", data);
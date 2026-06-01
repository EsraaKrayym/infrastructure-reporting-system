import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api"
});

// 🔥 Automatisch Token mitsenden
API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");

    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }

    return req;
});

export const login = (data) =>
    API.post("/auth/login", data);

export const getReports = () =>
    API.get("/reports");

export const updateStatus = (id, status) =>
    API.put(`/reports/${id}/status`, { status });

export default API;
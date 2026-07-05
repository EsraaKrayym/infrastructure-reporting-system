import axios from "axios";

const API = axios.create({
    baseURL:  "https://cityreport-backend.onrender.com/api"
    //baseURL: "http://localhost:5000/api"
});

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

export const updateReportStatus = (id, status) =>
    API.put(`/reports/${id}/status`, { status });

export const updateReportPriority = (id, priority) =>
    API.put(`/reports/${id}/priority`, { priority });

export const register = (data) =>
    API.post("/auth/register", data);

export const getUsers = () =>
    API.get("/users");

export const createCaseworker = (data) =>
    API.post("/users", data);

export const toggleBlockUser = (id) =>
    API.put(`/users/${id}/block`);

export const deleteUser = (id) =>
    API.delete(`/users/${id}`);

export default API;
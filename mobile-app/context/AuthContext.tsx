import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "../services/api";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const loadToken = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            if (storedToken) {
                setToken(storedToken);
                setAuthToken(storedToken);
                console.log("✅ Token geladen und in API gesetzt");
            }
        };
        loadToken();
    }, []);

    const login = async (newToken: string) => {
        await AsyncStorage.setItem("token", newToken);
        setToken(newToken);
        setAuthToken(newToken);
        console.log("✅ Login erfolgreich, Token in API gesetzt");
    };

    const logout = async () => {
        await AsyncStorage.removeItem("token");
        setToken(null);
        setAuthToken("");
        console.log("✅ Logout erfolgreich");
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

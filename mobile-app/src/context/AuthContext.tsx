import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const loadToken = async () => {
            const savedToken = await AsyncStorage.getItem("token");
            if (savedToken) setToken(savedToken);
        };
        loadToken();
    }, []);

    const login = async (newToken: string) => {
        setToken(newToken);
        await AsyncStorage.setItem("token", newToken);
    };

    const logout = async () => {
        setToken(null);
        await AsyncStorage.removeItem("token");
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
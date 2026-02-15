import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const loadToken = async () => {
            const storedToken = await AsyncStorage.getItem("token");
            if (storedToken) setToken(storedToken);
        };
        loadToken();
    }, []);

    const login = async (newToken: string) => {
        await AsyncStorage.setItem("token", newToken);
        setToken(newToken);
    };

    const logout = async () => {
        await AsyncStorage.removeItem("token");
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

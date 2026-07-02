import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    useEffect(() => {
        const loadAuth = async () => {
            const savedToken = await AsyncStorage.getItem("token");
            const savedUser = await AsyncStorage.getItem("user");
            const savedAvatarUri = await AsyncStorage.getItem("avatarUri");

            if (savedToken) setToken(savedToken);
            if (savedUser) setUser(JSON.parse(savedUser));
            if (savedAvatarUri) setAvatarUri(savedAvatarUri);
        };
        loadAuth();
    }, []);

    const login = async (newToken: string, newUser?: any) => {
        if (!newToken) {
            console.error("Login called with undefined token");
            return;
        }
        setToken(newToken);
        await AsyncStorage.setItem("token", newToken);

        if (newUser) {
            setUser(newUser);
            await AsyncStorage.setItem("user", JSON.stringify(newUser));
        }
    };

    const updateAvatar = async (newAvatarUri: string | null) => {
        setAvatarUri(newAvatarUri);

        if (newAvatarUri) {
            await AsyncStorage.setItem("avatarUri", newAvatarUri);
        } else {
            await AsyncStorage.removeItem("avatarUri");
        }
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
        setAvatarUri(null);
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        await AsyncStorage.removeItem("avatarUri");
    };

    return (
        <AuthContext.Provider value={{ token, user, avatarUri, login, logout, updateAvatar }}>
            {children}
        </AuthContext.Provider>
    );
};
import { useEffect, useState, useContext } from "react";
import { View, Text } from "react-native";
import { getReports } from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function MyReports() {
    const { token } = useContext(AuthContext);
    const [reports, setReports] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getReports(token);
                setReports(Array.isArray(data) ? data : data.reports || []);
            } catch (err) {
                console.error("Failed to load reports", err);
            }
        };
        if (token) load();
    }, [token]);

    return (
        <View style={{ padding: 20 }}>
            {reports.map((r) => (
                <Text key={r.id}>
                    {r.title} - {r.status}
                </Text>
            ))}
        </View>
    );
}

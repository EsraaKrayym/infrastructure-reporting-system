import { useEffect, useState, useContext } from "react";
import { View, Text } from "react-native";
import { getReports } from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function MyReports() {
    const { token } = useContext(AuthContext);
    const [reports, setReports] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const data = await getReports(token);
            setReports(data);
        };
        load();
    }, []);

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

import { useState, useContext } from "react";
import { View, TextInput, Button } from "react-native";
import * as Location from "expo-location";
import { createReport } from "@/services/api";
import { AuthContext } from "@/context/AuthContext";

export default function CreateReport() {
    const { token } = useContext(AuthContext);
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleCreate = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            if (!title.trim()) {
                setError("Titel ist erforderlich");
                return;
            }

            if (!token) {
                setError("Bitte melden Sie sich an");
                return;
            }

            const { coords } = await Location.getCurrentPositionAsync({});
            const result = await createReport(token, {
                title,
                description: "Auto description",
                category: "road_damage",
                latitude: coords.latitude,
                longitude: coords.longitude,
            });

            if (result.message === "Report erfolgreich gespeichert") {
                setSuccess("Report erfolgreich erstellt! ✅");
                setTitle("");
            } else {
                setError(result.message || "Fehler beim Erstellen des Reports");
            }
        } catch (err) {
            setError(err.message || "Fehler beim Erstellen des Reports");
            console.error("CREATE REPORT ERROR:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <TextInput
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                editable={!loading}
            />
            <Button
                title={loading ? "Wird erstellt..." : "Submit Report"}
                onPress={handleCreate}
                disabled={loading}
            />
            {error && <View><TextInput value={error} editable={false} /></View>}
            {success && <View><TextInput value={success} editable={false} /></View>}
        </View>
    );
}

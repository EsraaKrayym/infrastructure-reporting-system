import { useState, useContext } from "react";
import { View, TextInput, Button } from "react-native";
import * as Location from "expo-location";
import { createReport } from "../services/api";
import { AuthContext } from "../context/AuthContext";

export default function CreateReport() {
    const { token } = useContext(AuthContext);
    const [title, setTitle] = useState("");

    const handleCreate = async () => {
        const { coords } = await Location.getCurrentPositionAsync({});
        await createReport(token, {
            title,
            description: "Auto description",
            category: "road_damage",
            latitude: coords.latitude,
            longitude: coords.longitude,
        });
    };

    return (
        <View style={{ padding: 20 }}>
            <TextInput placeholder="Title" value={title} onChangeText={setTitle} />
            <Button title="Submit Report" onPress={handleCreate} />
        </View>
    );
}

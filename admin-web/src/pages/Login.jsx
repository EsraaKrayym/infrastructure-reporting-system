import { useState } from "react";
import { login } from "../services/api";
import "./Login.css";

export default function Login({ setToken }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        try {
            const res = await login({ email, password });

            console.log("LOGIN RESPONSE:", res.data);

            // 🔥 Prüfen ob user existiert
            if (!res.data || !res.data.token) {
                setError("Ungültige Serverantwort");
                return;
            }

            // 🔥 Optional: Rolle prüfen
            if (res.data.user?.role !== "caseworker") {
                setError("Kein Admin-Zugang");
                return;
            }

            // ✅ Token speichern
            localStorage.setItem("token", res.data.token);
            setToken(res.data.token);

        } catch (err) {
            console.error("LOGIN ERROR:", err);
            setError("Login fehlgeschlagen");
        }
    };

    return (
        <div className="loginWrapper">
            <div className="loginBox">

                <div className="logo">CityReport</div>

                <h2>Login</h2>
                <p>Schön, Sie wiederzusehen.</p>

                {error && <div className="error">{error}</div>}

                <label>Email</label>
                <input
                    type="email"
                    placeholder="example@email.com"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label>Passwort</label>
                <div className="passwordField">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="eye"
                    >
            👁
          </span>
                </div>

                <button onClick={handleLogin}>
                    Login
                </button>

                <div className="links">
                    <span>Passwort vergessen?</span>
                    <span className="register">Registrierung</span>
                </div>

            </div>
        </div>
    );
}
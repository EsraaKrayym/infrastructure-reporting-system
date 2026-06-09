import { useState } from "react";
import { login } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const res = await login({ email, password });

            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));

            navigate("/dashboard");
        } catch {
            alert("Ungültige Anmeldedaten");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-left">
                <h1>CityReport</h1>

                <p>
                    Verwaltung und Bearbeitung eingehender
                    Bürgermeldungen in einer zentralen Plattform.
                </p>
            </div>

            <div className="login-right">

                <div className="login-card">

                    <h2>Admin Login</h2>

                    <p className="subtitle">
                        Bitte melden Sie sich an
                    </p>

                    <form onSubmit={handleLogin}>

                        <input
                            type="email"
                            placeholder="E-Mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <div className="password-wrapper">

                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Passwort"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />

                            <button
                                type="button"
                                className="show-btn"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                            >
                                {showPassword ? "🙈" : "👁"}
                            </button>

                        </div>

                        <button
                            className="login-btn"
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Anmeldung..."
                                : "Anmelden"}
                        </button>

                    </form>

                </div>

            </div>

        </div>
    );
}
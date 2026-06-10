import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";

export default function Register() {

    const navigate = useNavigate();

    const [name,setName] = useState("");
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");

    const handleRegister = async (e) => {

        e.preventDefault();

        // später API Call

        alert("Benutzer erfolgreich registriert");

        navigate("/");
    };

    return (

        <div className="login-page">

            <div className="login-left">

                <h1>CityReport</h1>

                <p>
                    Registrieren Sie neue
                    Sachbearbeiter und Administratoren.
                </p>

            </div>

            <div className="login-right">

                <div className="login-card">

                    <h2>Registrierung</h2>

                    <p className="subtitle">
                        Neues Konto erstellen
                    </p>

                    <form onSubmit={handleRegister}>

                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e)=>setName(e.target.value)}
                            required
                        />

                        <input
                            type="email"
                            placeholder="E-Mail"
                            value={email}
                            onChange={(e)=>setEmail(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="Passwort"
                            value={password}
                            onChange={(e)=>setPassword(e.target.value)}
                            required
                        />

                        <select className="role-select">

                            <option value="caseworker">
                                Sachbearbeiter
                            </option>

                            <option value="admin">
                                Administrator
                            </option>

                        </select>

                        <button
                            className="login-btn"
                            type="submit"
                        >
                            Registrieren
                        </button>

                    </form>

                </div>

            </div>

        </div>
    );
}
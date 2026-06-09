import { useState } from "react";
import "../css/Login.css";

export default function ForgotPassword() {

    const [email,setEmail] = useState("");

    const handleSubmit = (e) => {

        e.preventDefault();

        alert(
            "Falls ein Konto existiert, wurde eine E-Mail versendet."
        );
    };

    return (

        <div className="login-page">

            <div className="login-left">

                <h1>CityReport</h1>

                <p>
                    Passwort zurücksetzen.
                </p>

            </div>

            <div className="login-right">

                <div className="login-card">

                    <h2>Passwort vergessen</h2>

                    <form onSubmit={handleSubmit}>

                        <input
                            type="email"
                            placeholder="E-Mail"
                            value={email}
                            onChange={(e)=>setEmail(e.target.value)}
                        />

                        <button
                            className="login-btn"
                            type="submit"
                        >
                            Link senden
                        </button>

                    </form>

                </div>

            </div>

        </div>
    );
}
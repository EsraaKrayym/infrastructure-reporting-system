import { useEffect, useState } from "react";
import { getReports } from "../services/api";
import { Link } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard({ token }) {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const res = await getReports(token);
            setReports(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="layout">

            {/* SIDEBAR */}
            <div className="sidebar">

                <div className="sidebar-header">
                    <h1>CityReport</h1>
                </div>

                <div className="menu">

                    <Link to="/dashboard" className="menu-item active">
                        📊 Dashboard
                    </Link>

                    <Link to="/reports" className="menu-item">
                        📋 Meldungen
                    </Link>

                    <Link to="/users" className="menu-item">
                        👥 Benutzer
                    </Link>

                    <Link to="/categories" className="menu-item">
                        🏷 Kategorien
                    </Link>

                    <Link to="/map" className="menu-item">
                        🗺 Map
                    </Link>

                    <Link to="/notifications" className="menu-item">
                        🔔 Benachrichtigungen
                    </Link>

                    <Link to="/statistics" className="menu-item">
                        📈 Statistiken
                    </Link>

                    <Link to="/settings" className="menu-item">
                        ⚙ Einstellungen
                    </Link>

                </div>

                <div className="admin-box">
                    <div className="avatar">A</div>

                    <div>
                        <h4>Administrator</h4>
                        <p>admin@cityreport.de</p>
                    </div>
                </div>

            </div>

            {/* MAIN CONTENT */}
            <div className="main">

                {/* HEADER */}
                <div className="header">

                    <div>
                        <h2>Willkommen zurück 👋</h2>
                        <p>Übersicht aller aktuellen Meldungen</p>
                    </div>

                    <input
                        className="search"
                        placeholder="Suchen..."
                    />

                </div>

                {/* STATISTIK KARTEN */}
                <div className="stats">

                    <div className="card">
                        <h4>Gesamt Meldungen</h4>
                        <h2>{reports.length}</h2>
                    </div>

                    <div className="card">
                        <h4>Offene Meldungen</h4>
                        <h2>
                            {reports.filter(
                                r => r.status === "Neu"
                            ).length}
                        </h2>
                    </div>

                    <div className="card">
                        <h4>Erledigte Meldungen</h4>
                        <h2>
                            {reports.filter(
                                r => r.status === "Erledigt"
                            ).length}
                        </h2>
                    </div>

                </div>

                {/* LETZTE MELDUNGEN */}
                <div className="reportList">

                    <h3>Letzte Meldungen</h3>

                    {reports.map((r) => (

                        <div
                            key={r.id}
                            className="reportCard"
                        >

                            <div>

                                <h4>{r.title}</h4>

                                <p>{r.description}</p>

                                <span
                                    className={`badge ${r.priority}`}
                                >
                                    {r.priority}
                                </span>

                            </div>

                            <div>
                                <span className="status">
                                    {r.status}
                                </span>
                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}
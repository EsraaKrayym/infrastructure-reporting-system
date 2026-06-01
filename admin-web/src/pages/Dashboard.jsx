import { useEffect, useState } from "react";
import { getReports } from "../services/api";
import "./Dashboard.css";

export default function Dashboard({ token }) {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        const res = await getReports(token);
        setReports(res.data);
    };

    return (
        <div className="layout">

            {/* SIDEBAR */}
            <div className="sidebar">
                <h2 className="logo">Admin</h2>

                <ul>
                    <li className="active">Dashboard</li>
                    <li>Reports</li>
                    <li>Accounts</li>
                    <li>Settings</li>
                </ul>
            </div>

            {/* MAIN */}
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

                {/* STAT CARDS */}
                <div className="stats">
                    <div className="card">
                        <h4>Gesamt Meldungen</h4>
                        <h2>{reports.length}</h2>
                    </div>

                    <div className="card">
                        <h4>Offen</h4>
                        <h2>
                            {reports.filter(r => r.status === "Neu").length}
                        </h2>
                    </div>

                    <div className="card">
                        <h4>Erledigt</h4>
                        <h2>
                            {reports.filter(r => r.status === "Erledigt").length}
                        </h2>
                    </div>
                </div>

                {/* REPORT LIST */}
                <div className="reportList">
                    <h3>Letzte Meldungen</h3>

                    {reports.map(r => (
                        <div key={r.id} className="reportCard">
                            <div>
                                <h4>{r.title}</h4>
                                <p>{r.description}</p>
                                <span className={`badge ${r.priority}`}>
                  {r.priority}
                </span>
                            </div>
                            <div>
                                <span className="status">{r.status}</span>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
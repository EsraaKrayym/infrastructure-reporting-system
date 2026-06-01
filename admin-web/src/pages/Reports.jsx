import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./Reports.css";

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadReports = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            if (!token) {
                setError("Bitte melden Sie sich an");
                setLoading(false);
                return;
            }

            console.log("Loading reports with token:", token.substring(0, 20) + "...");

            const res = await API.get("/reports", {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Reports loaded:", res.data);
            setReports(res.data || []);
            setError("");
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Fehler beim Laden:", err);
            setError(err.response?.data?.message || err.message || "Fehler beim Laden der Reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
        const interval = setInterval(loadReports, 10000);
        return () => clearInterval(interval);
    }, []);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high":
                return "#dc2626";
            case "medium":
                return "#f97316";
            case "low":
                return "#16a34a";
            default:
                return "#2563eb";
        }
    };

    const translatePriority = (priority) => {
        switch (priority) {
            case "high":
                return "Hoch";
            case "medium":
                return "Mittel";
            case "low":
                return "Niedrig";
            default:
                return priority;
        }
    };

    return (
        <div className="reports-container">
            <div className="reports-header">
                <h2 className="reports-title">Alle Meldungen</h2>
                <button className="btn refresh" onClick={loadReports} disabled={loading}>
                    {loading ? "Lädt..." : "Aktualisieren"}
                </button>
            </div>

            {loading && <p>⏳ Wird geladen...</p>}
            {error && <p style={{ color: "red" }}>❌ {error}</p>}
            {lastUpdated && !loading && !error && (
                <p style={{ marginBottom: 16, color: "#555" }}>
                    Zuletzt aktualisiert: {new Date(lastUpdated).toLocaleTimeString()}
                </p>
            )}
            {!loading && reports.length === 0 && !error && (
                <p>Keine Reports gefunden</p>
            )}

            <div className="reports-grid">
                {reports.map((report) => (
                    <div key={report.id} className="report-card">

                        <div className="report-header">
                            <h3>{report.title}</h3>
                            <span
                                className="priority-badge"
                                style={{ background: getPriorityColor(report.priority) }}
                            >
                                {translatePriority(report.priority)}
                            </span>
                        </div>

                        {report.photo && (
                            <img
                                src={`http://localhost:5000/uploads/${report.photo}`}
                                alt="report"
                                className="report-image"
                            />
                        )}

                        <p className="report-description">
                            {report.description}
                        </p>

                        <div className="report-details">
                            <div><strong>Adresse:</strong> {report.address || "Nicht angegeben"}</div>
                            <div><strong>Status:</strong> {report.status}</div>
                            <div><strong>Koordinaten:</strong> {report.latitude}, {report.longitude}</div>
                            <div>
                                <strong>Erstellt am:</strong>{" "}
                                {new Date(report.created_at).toLocaleString()}
                            </div>
                        </div>

                        <div className="report-actions">
                            <button className="btn status">Status ändern</button>
                            <button className="btn edit">Bearbeiten</button>
                            <button className="btn delete">Löschen</button>
                            <button className="btn history">Verlauf</button>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
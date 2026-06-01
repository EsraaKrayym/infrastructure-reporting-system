import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./Reports.css";

const uploadBaseUrl = API.defaults.baseURL.replace(/\/api$/, "");

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
                return "#16a34a";
            case "low":
                return "#0f766e";
            default:
                return "#2563eb";
        }
    };

    const translatePriority = (priority) => {
        switch (priority) {
            case "high":
                return "Gefährlich";
            case "medium":
                return "Mittelschwer";
            case "low":
                return "Leicht";
            default:
                return priority;
        }
    };

    const getStatusLabel = (status) => {
        switch ((status || "").toLowerCase()) {
            case "neu":
            case "open":
            case "pending":
                return "Neu";
            case "in_review":
            case "in progress":
            case "in_progress":
                return "In Bearbeitung";
            case "repaired":
            case "done":
            case "fixed":
                return "Repariert";
            default:
                return status || "Unbekannt";
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
                {reports.map((report) => {
                    const createdAt = report.created_at || report.createdAt || report.createdAt;
                    const createdDate = createdAt ? new Date(createdAt).toLocaleDateString("de-DE") : "Unbekannt";
                    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;
                    return (
                        <div key={report.id} className="report-card">
                            <div className="report-top">
                                <span className="report-badge">#{report.id ?? "--"}</span>
                                <span className="status-pill" style={{ background: getPriorityColor(report.priority) }}>
                                    {translatePriority(report.priority)}
                                </span>
                            </div>

                            <div className="report-title-row">
                                <h3>{report.title || "Unbenannte Meldung"}</h3>
                                <span className="status-label">{getStatusLabel(report.status)}</span>
                            </div>

                            <div className="report-category">{report.category || "Allgemein"}</div>

                            {report.photo ? (
                                <img
                                    src={`${uploadBaseUrl}/uploads/${report.photo}`}
                                    alt="report"
                                    className="report-image"
                                />
                            ) : (
                                <div className="report-image placeholder">Kein Foto vorhanden</div>
                            )}

                            <p className="report-description">
                                {report.description || "Keine Beschreibung verfügbar."}
                            </p>

                            <div className="report-contact-card">
                                <div>
                                    <div className="contact-name">Reporter #{report.user_id || "unbekannt"}</div>
                                    <div className="contact-subtitle">Admin User</div>
                                </div>
                                <div className="contact-phone">+49 170 0000000</div>
                            </div>

                            <div className="report-details report-details-grid">
                                <div><strong>Lat:</strong> {report.latitude ?? "-"}</div>
                                <div><strong>Lng:</strong> {report.longitude ?? "-"}</div>
                                <a className="map-link" href={mapUrl} target="_blank" rel="noreferrer">Auf Google Maps ansehen</a>
                            </div>

                            <div className="report-actions report-actions-large">
                                <button className="btn status">Status</button>
                                <button className="btn edit">Bearbeiten</button>
                                <button className="btn delete">Löschen</button>
                                <button className="btn history">Verlauf</button>
                                <button className="btn share">WhatsApp</button>
                            </div>

                            <div className="report-footer">
                                <span>{createdDate}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
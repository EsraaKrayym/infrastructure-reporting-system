import React, { useEffect, useState } from "react";
import API from "../services/api";
import "../css/Reports.css";
import { Link } from "react-router-dom";
import { updateReport, updateReportPriority, updateReportStatus } from "../services/api";

const uploadBaseUrl = API.defaults.baseURL.replace(/\/api$/, "");

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [brokenImages, setBrokenImages] = useState({});
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const isAdmin = currentUser?.role === "admin";
    const isCaseworker = currentUser?.role === "caseworker";

    const loadReports = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            if (!token) {
                setError("Bitte melden Sie sich an");
                setLoading(false);
                return;
            }

            const res = await API.get("/reports", {
                headers: { Authorization: `Bearer ${token}` }
            });

            setReports(res.data || []);
            setError("");
            setLastUpdated(new Date());
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Fehler beim Laden der Reports"
            );
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
                return "#f59e0b";
            case "low":
                return "#16a34a";
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
                return priority || "Unbekannt";
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

    const statusOptions = ["Neu", "In Prüfung", "In Bearbeitung", "Erledigt", "Abgelehnt"];
    const priorityOptions = ["low", "medium", "high"];

    const handleUpdateStatus = async (id, status) => {
        try {
            setUpdatingId(id);
            await updateReportStatus(id, status);
            await loadReports();
        } catch (err) {
            alert(err?.response?.data?.message || "Status konnte nicht aktualisiert werden");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUpdatePriority = async (id, priority) => {
        try {
            setUpdatingId(id);
            await updateReportPriority(id, priority);
            await loadReports();
        } catch (err) {
            alert(err?.response?.data?.message || "Priorität konnte nicht aktualisiert werden");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleQuickEdit = async (report) => {
        const nextTitle = window.prompt("Titel", report.title || "") ;
        if (nextTitle === null) return;

        const nextDescription = window.prompt("Beschreibung", report.description || "");
        if (nextDescription === null) return;

        const nextAddress = window.prompt("Adresse", report.address || "");
        if (nextAddress === null) return;

        try {
            setUpdatingId(report.id);
            await updateReport(report.id, {
                title: nextTitle,
                description: nextDescription,
                address: nextAddress,
            });
            await loadReports();
        } catch (err) {
            alert(err?.response?.data?.message || "Report konnte nicht bearbeitet werden");
        } finally {
            setUpdatingId(null);
        }
    };

    const getDisplayTitle = (report) => {
        const rawTitle = (report?.title || "").trim().toLowerCase();
        const isDefaultMobileTitle = !rawTitle || rawTitle === "meldung vom mobilgerät";

        if (isDefaultMobileTitle) {
            return "Meldung";
        }

        return report.title;
    };

    const resolvePhotoUrl = (report) => {
        const photo = report?.photo;
        if (!photo) return null;

        if (photo.startsWith("data:image/")) {
            return photo;
        }

        if (photo.startsWith("http://") || photo.startsWith("https://")) {
            return photo;
        }

        return `${uploadBaseUrl}/api/reports/${report.id}/photo`;
    };

    return (
        <div className="reports-layout">

            {/* SIDEBAR */}
            <div className="sidebar">

                <div className="sidebar-header">
                    <h1>CityReport</h1>
                </div>

                <div className="menu">
                    <Link to="/dashboard" className="menu-item">
                        📊 Dashboard
                    </Link>

                    <Link to="/reports" className="menu-item active">
                        📋 Meldungen
                    </Link>

                    {isAdmin && (
                        <Link to="/users" className="menu-item">
                            👥 Benutzer
                        </Link>
                    )}

                    {(isAdmin || isCaseworker) && (
                        <Link to="/categories" className="menu-item">
                            🏷 Kategorien
                        </Link>
                    )}

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
                    <div className="avatar">{String(currentUser?.name || "A").charAt(0).toUpperCase()}</div>

                    <div>
                        <h4>{currentUser?.name || "Benutzer"}</h4>
                        <p>{currentUser?.email || "-"}</p>
                    </div>
                </div>

            </div>

            {/* MAIN CONTENT */}
            <div className="reports-content">

                <div className="reports-header">
                    <div>
                        <h2 className="reports-title">Alle Meldungen</h2>

                        {lastUpdated && !loading && !error && (
                            <p className="updated-text">
                                Zuletzt aktualisiert:{" "}
                                {new Date(lastUpdated).toLocaleTimeString()}
                            </p>
                        )}
                    </div>

                    <button
                        className="btn refresh"
                        onClick={loadReports}
                        disabled={loading}
                    >
                        {loading ? "Lädt..." : "Aktualisieren"}
                    </button>
                </div>

                {loading && <p>⏳ Wird geladen...</p>}

                {error && (
                    <p className="error-message">
                        ❌ {error}
                    </p>
                )}

                {!loading && reports.length === 0 && !error && (
                    <p>Keine Reports gefunden</p>
                )}

                <div className="reports-grid">
                    {reports.map((report) => {
                        const photoUrl = resolvePhotoUrl(report);
                        const imageBroken = !!brokenImages[report.id];
                        const description =
                            (report.description || "").trim() ||
                            "Keine Beschreibung verfügbar.";
                        const address =
                            (report.address || "").trim() ||
                            "Keine Adresse angegeben";
                        const reporterId = report.user_id ?? "Unbekannt";
                        const createdAt = report.created_at || report.createdAt;
                        const createdDateTime = createdAt
                            ? new Date(createdAt).toLocaleString("de-DE")
                            : "Unbekannt";

                        return (
                            <div key={report.id} className="report-card">

                                <div className="report-top">
                                    <span className="report-badge">
                                        #{report.id ?? "--"}
                                    </span>

                                    <span
                                        className="status-pill"
                                        style={{
                                            background: getPriorityColor(report.priority)
                                        }}
                                    >
                                        {translatePriority(report.priority)}
                                    </span>
                                </div>

                                <div className="report-title-row">
                                    <h3>
                                        {getDisplayTitle(report)}
                                    </h3>

                                    <span className="status-label">
                                        {getStatusLabel(report.status)}
                                    </span>
                                </div>

                                {photoUrl && !imageBroken ? (
                                    <img
                                        src={photoUrl}
                                        alt="report"
                                        className="report-image"
                                        onError={() =>
                                            setBrokenImages((prev) => ({
                                                ...prev,
                                                [report.id]: true
                                            }))
                                        }
                                    />
                                ) : (
                                    <div className="report-image placeholder">
                                        Kein Foto vorhanden
                                    </div>
                                )}

                                <div className="report-meta-card">
                                    <div className="report-meta-row report-meta-row-stack">
                                        <span className="report-meta-label">Beschreibung</span>
                                        <span className="report-meta-value report-meta-value-stack">{description}</span>
                                    </div>

                                    <div className="report-meta-row">
                                        <span className="report-meta-label">Adresse</span>
                                        <span className="report-meta-value">{address}</span>
                                    </div>

                                    <div className="report-meta-row">
                                        <span className="report-meta-label">Benutzer-ID</span>
                                        <span className="report-meta-value">#{reporterId}</span>
                                    </div>

                                    <div className="report-meta-row">
                                        <span className="report-meta-label">Datum & Uhrzeit</span>
                                        <span className="report-meta-value">{createdDateTime}</span>
                                    </div>

                                    {isCaseworker && (
                                        <div className="report-meta-row report-meta-row-stack" style={{ marginTop: 8 }}>
                                            <span className="report-meta-label">Bearbeitung</span>

                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                <select
                                                    defaultValue={report.status || "Neu"}
                                                    onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                                                    disabled={updatingId === report.id}
                                                    style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
                                                >
                                                    {statusOptions.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>

                                                <select
                                                    defaultValue={report.priority || "medium"}
                                                    onChange={(e) => handleUpdatePriority(report.id, e.target.value)}
                                                    disabled={updatingId === report.id}
                                                    style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
                                                >
                                                    {priorityOptions.map((p) => (
                                                        <option key={p} value={p}>
                                                            {p === "high" ? "Hoch" : p === "medium" ? "Mittel" : "Niedrig"}
                                                        </option>
                                                    ))}
                                                </select>

                                                <button
                                                    type="button"
                                                    className="btn refresh"
                                                    onClick={() => handleQuickEdit(report)}
                                                    disabled={updatingId === report.id}
                                                >
                                                    Bearbeiten
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        );
                    })}
                </div>

            </div>

        </div>
    );
}
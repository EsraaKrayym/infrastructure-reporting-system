import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getReports } from "../services/api";
import "../css/Dashboard.css";

const normalizeStatus = (status) => {
    const value = String(status || "").toLowerCase();
    if (["neu", "open", "pending", "new"].includes(value)) return "Neu";
    if (["in prüfung", "in_review"].includes(value)) return "In Prüfung";
    if (["in bearbeitung", "in_progress", "in progress"].includes(value)) return "In Bearbeitung";
    if (["erledigt", "done", "fixed", "repaired", "completed"].includes(value)) return "Erledigt";
    if (["abgelehnt", "rejected", "declined"].includes(value)) return "Abgelehnt";
    return status || "Unbekannt";
};

const priorityLabel = (priority) => {
    if (priority === "high") return "Hoch";
    if (priority === "low") return "Niedrig";
    return "Mittel";
};

export default function Dashboard({ token }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const isAdmin = currentUser?.role === "admin";

    useEffect(() => {
        const loadReports = async () => {
            try {
                setLoading(true);
                const res = await getReports(token);
                setReports(Array.isArray(res.data) ? res.data : []);
                setError("");
            } catch (err) {
                setError(err?.response?.data?.message || err?.message || "Reports konnten nicht geladen werden");
            } finally {
                setLoading(false);
            }
        };

        loadReports();
    }, [token]);

    const dashboardData = useMemo(() => {
        const total = reports.length;
        const open = reports.filter((r) => normalizeStatus(r.status) === "Neu").length;
        const inProgress = reports.filter((r) => normalizeStatus(r.status) === "In Bearbeitung").length;
        const completed = reports.filter((r) => normalizeStatus(r.status) === "Erledigt").length;
        const highPriority = reports.filter((r) => String(r.priority || "").toLowerCase() === "high").length;
        const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

        const statusCounts = ["Neu", "In Prüfung", "In Bearbeitung", "Erledigt", "Abgelehnt"].map((status) => ({
            label: status,
            count: reports.filter((r) => normalizeStatus(r.status) === status).length,
        }));

        const latestReports = [...reports]
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 5);

        return { total, open, inProgress, completed, highPriority, completionRate, statusCounts, latestReports };
    }, [reports]);

    const quickActions = [
        { to: "/reports", label: "Meldungen prüfen", hint: "Alle Reports im Überblick" },
        { to: "/statistics", label: "Statistiken ansehen", hint: "Live-Kennzahlen und Diagramme" },
        ...(isAdmin ? [{ to: "/users", label: "Benutzer verwalten", hint: "Konten und Rollen pflegen" }] : []),
    ];

    return (
        <div className="layout dashboard-layout">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h1>CityReport</h1>
                </div>

                <div className="menu">
                    <Link to="/dashboard" className="menu-item active">📊 Dashboard</Link>
                    <Link to="/reports" className="menu-item">📋 Meldungen</Link>
                    {isAdmin && <Link to="/users" className="menu-item">👥 Benutzer</Link>}
                    <Link to="/map" className="menu-item">🗺 Map</Link>
                    <Link to="/notifications" className="menu-item">🔔 Benachrichtigungen</Link>
                    <Link to="/statistics" className="menu-item">📈 Statistiken</Link>
                    <Link to="/settings" className="menu-item">⚙ Einstellungen</Link>
                </div>

                <div className="admin-box">
                    <div className="avatar">{String(currentUser?.name || "A").charAt(0).toUpperCase()}</div>
                    <div>
                        <h4>{currentUser?.name || "Benutzer"}</h4>
                        <p>{currentUser?.email || "-"}</p>
                    </div>
                </div>
            </div>

            <div className="main dashboard-main">
                <div className="dashboard-hero">
                    <div>
                        <span className="hero-kicker">Live-Übersicht</span>
                        <h2>Guten Tag, {currentUser?.name || "Benutzer"}</h2>
                        <p>
                            Hier siehst du den aktuellen Stand aller Meldungen, Prioritäten und Bearbeitungen in einer klaren, modernen Übersicht.
                        </p>
                    </div>

                    <div className="hero-meta-card">
                        <span>Erledigungsquote</span>
                        <strong>{dashboardData.completionRate}%</strong>
                        <small>{dashboardData.completed} von {dashboardData.total} erledigt</small>
                    </div>
                </div>

                {loading && <p className="dashboard-state">⏳ Dashboard wird geladen...</p>}
                {!loading && error && <p className="dashboard-state error">❌ {error}</p>}

                {!loading && !error && (
                    <>
                        <div className="stats-grid">
                            <article className="stat-panel primary">
                                <span>Gesamtmeldungen</span>
                                <strong>{dashboardData.total}</strong>
                                <p>Alle derzeit aktiven Reports</p>
                            </article>

                            <article className="stat-panel warning">
                                <span>Offene Meldungen</span>
                                <strong>{dashboardData.open}</strong>
                                <p>Neu eingegangene Bürgermeldungen</p>
                            </article>

                            <article className="stat-panel info">
                                <span>In Bearbeitung</span>
                                <strong>{dashboardData.inProgress}</strong>
                                <p>Aktiv durch Sachbearbeitung geprüft</p>
                            </article>

                            <article className="stat-panel success">
                                <span>Hohe Priorität</span>
                                <strong>{dashboardData.highPriority}</strong>
                                <p>Sofort relevante Meldungen</p>
                            </article>
                        </div>

                        <div className="content-grid">
                            <section className="dashboard-card chart-card">
                                <div className="section-head">
                                    <div>
                                        <h3>Statusverteilung</h3>
                                        <p>Verhältnis der aktuellen Bearbeitungsstände</p>
                                    </div>
                                </div>

                                <div className="status-bars">
                                    {dashboardData.statusCounts.map((item) => (
                                        <div key={item.label} className="status-row">
                                            <div className="status-row-head">
                                                <span>{item.label}</span>
                                                <strong>{item.count}</strong>
                                            </div>
                                            <div className="status-track">
                                                <div
                                                    className="status-fill"
                                                    style={{ width: dashboardData.total === 0 ? 0 : `${(item.count / dashboardData.total) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="dashboard-card quick-card">
                                <div className="section-head">
                                    <div>
                                        <h3>Schnellzugriff</h3>
                                        <p>Die wichtigsten Bereiche direkt öffnen</p>
                                    </div>
                                </div>

                                <div className="quick-actions">
                                    {quickActions.map((action) => (
                                        <Link key={action.to} to={action.to} className="quick-action-card">
                                            <strong>{action.label}</strong>
                                            <span>{action.hint}</span>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="content-grid two-columns">
                            <section className="dashboard-card recent-card">
                                <div className="section-head">
                                    <div>
                                        <h3>Letzte Meldungen</h3>
                                        <p>Die aktuellsten Reports aus der Datenbank</p>
                                    </div>
                                    <Link to="/reports" className="section-link">Alle anzeigen</Link>
                                </div>

                                <div className="recent-list">
                                    {dashboardData.latestReports.map((report) => {
                                        const isDefaultMobileTitle = !report.title || String(report.title).trim().toLowerCase() === "meldung vom mobilgerät";
                                        const displayTitle = isDefaultMobileTitle ? `Meldung #${report.id ?? "--"}` : report.title;

                                        return (
                                            <div key={report.id} className="recent-item">
                                                <div>
                                                    <h4>{displayTitle}</h4>
                                                    <p>{report.description || "Keine Beschreibung verfügbar."}</p>
                                                </div>
                                                <div className="recent-meta">
                                                    <span className={`status-pill ${String(report.priority || "medium").toLowerCase()}`}>
                                                        {priorityLabel(report.priority)}
                                                    </span>
                                                    <small>{normalizeStatus(report.status)}</small>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {dashboardData.latestReports.length === 0 && (
                                        <p className="empty-text">Noch keine Reports vorhanden.</p>
                                    )}
                                </div>
                            </section>

                            <section className="dashboard-card overview-card">
                                <div className="section-head">
                                    <div>
                                        <h3>Kurzübersicht</h3>
                                        <p>Wichtige Kennzahlen auf einen Blick</p>
                                    </div>
                                </div>

                                <div className="overview-stack">
                                    <div className="overview-item">
                                        <span>Erledigt</span>
                                        <strong>{dashboardData.completed}</strong>
                                    </div>
                                    <div className="overview-item">
                                        <span>Offen</span>
                                        <strong>{dashboardData.open}</strong>
                                    </div>
                                    <div className="overview-item">
                                        <span>In Bearbeitung</span>
                                        <strong>{dashboardData.inProgress}</strong>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
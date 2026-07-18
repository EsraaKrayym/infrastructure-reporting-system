import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getReports } from "../services/api";
import "../css/Statistics.css";

const formatPercent = (value) => `${Math.round(value)}%`;

const normalizeStatus = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (["neu", "open", "pending", "new"].includes(normalized)) return "Neu";
    if (["in prüfung", "in_review"].includes(normalized)) return "In Prüfung";
    if (["in bearbeitung", "in_progress", "in progress"].includes(normalized)) return "In Bearbeitung";
    if (["erledigt", "done", "fixed", "repaired", "completed"].includes(normalized)) return "Erledigt";
    if (["abgelehnt", "rejected", "declined"].includes(normalized)) return "Abgelehnt";
    return status || "Unbekannt";
};

const priorityLabel = (priority) => {
    if (priority === "high") return "Hoch";
    if (priority === "low") return "Niedrig";
    return "Mittel";
};

export default function Statistics() {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const isAdmin = currentUser?.role === "admin";
    const isCaseworker = currentUser?.role === "caseworker";

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true);
                const res = await getReports();
                setReports(Array.isArray(res.data) ? res.data : []);
                setError("");
                setLastUpdated(new Date());
            } catch (err) {
                setError(err?.response?.data?.message || err?.message || "Statistiken konnten nicht geladen werden");
            } finally {
                setLoading(false);
            }
        };

        loadStats();
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const total = reports.length;
        const completed = reports.filter((r) => normalizeStatus(r.status) === "Erledigt").length;
        const inProgress = reports.filter((r) => normalizeStatus(r.status) === "In Bearbeitung").length;
        const inReview = reports.filter((r) => normalizeStatus(r.status) === "In Prüfung").length;
        const open = reports.filter((r) => normalizeStatus(r.status) === "Neu").length;
        const rejected = reports.filter((r) => normalizeStatus(r.status) === "Abgelehnt").length;
        const withLocation = reports.filter((r) => Number.isFinite(Number(r.latitude)) && Number.isFinite(Number(r.longitude))).length;
        const highPriority = reports.filter((r) => r.priority === "high").length;
        const completionRate = total === 0 ? 0 : (completed / total) * 100;

        const byStatus = ["Neu", "In Prüfung", "In Bearbeitung", "Erledigt", "Abgelehnt"].map((status) => {
            const count = reports.filter((r) => normalizeStatus(r.status) === status).length;
            return { label: status, count, percentage: total === 0 ? 0 : (count / total) * 100 };
        });

        const categoryMap = new Map();
        reports.forEach((r) => {
            const key = String(r.category || "Unbekannt");
            categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
        });

        const topCategories = Array.from(categoryMap.entries())
            .map(([label, count]) => ({ label, count, percentage: total === 0 ? 0 : (count / total) * 100 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const priorityMap = ["high", "medium", "low"].map((level) => {
            const count = reports.filter((r) => String(r.priority || "medium").toLowerCase() === level).length;
            return { label: priorityLabel(level), count, percentage: total === 0 ? 0 : (count / total) * 100 };
        });

        const latestReports = [...reports]
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 6);

        return {
            total,
            completed,
            inProgress,
            inReview,
            open,
            rejected,
            withLocation,
            highPriority,
            completionRate,
            byStatus,
            topCategories,
            priorityMap,
            latestReports,
        };
    }, [reports]);

    return (
        <div className="layout">
            <div className="sidebar">
                <div className="sidebar-header">
                    <h1>CityReport</h1>
                </div>

                <div className="menu">
                    <Link to="/dashboard" className="menu-item">📊 Dashboard</Link>
                    <Link to="/reports" className="menu-item">📋 Meldungen</Link>
                    {isAdmin && <Link to="/users" className="menu-item">👥 Benutzer</Link>}
                    {isCaseworker && <Link to="/categories" className="menu-item">🏷 Kategorien</Link>}
                    <Link to="/map" className="menu-item">🗺 Karte</Link>
                    <Link to="/notifications" className="menu-item">🔔 Benachrichtigungen</Link>
                    <Link to="/statistics" className="menu-item active">📈 Statistiken</Link>
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

            <div className="statistics-content">
                <div className="statistics-header">
                    <div>
                        <h1>Statistiken</h1>
                        <p>Live-Auswertung der aktuellen Bürgermeldungen für die Sachbearbeitung.</p>
                    </div>
                    <div className="statistics-header-meta">
                        {lastUpdated && !loading && !error && (
                            <span>Aktualisiert: {new Date(lastUpdated).toLocaleTimeString("de-DE")}</span>
                        )}
                    </div>
                </div>

                {loading && <p>⏳ Statistiken werden geladen...</p>}
                {!loading && error && <p className="statistics-error">❌ {error}</p>}

                {!loading && !error && (
                    <>
                        <div className="stats-kpi-grid">
                            <article className="stats-kpi-card accent-blue">
                                <span>Gesamtmeldungen</span>
                                <strong>{stats.total}</strong>
                                <small>Alle derzeit sichtbaren Reports</small>
                            </article>
                            <article className="stats-kpi-card accent-green">
                                <span>Erledigungsquote</span>
                                <strong>{formatPercent(stats.completionRate)}</strong>
                                <small>{stats.completed} von {stats.total} erledigt</small>
                            </article>
                            <article className="stats-kpi-card accent-orange">
                                <span>In Bearbeitung</span>
                                <strong>{stats.inProgress + stats.inReview}</strong>
                                <small>{stats.inReview} in Prüfung, {stats.inProgress} aktiv</small>
                            </article>
                            <article className="stats-kpi-card accent-red">
                                <span>Hohe Priorität</span>
                                <strong>{stats.highPriority}</strong>
                                <small>Sofort relevante Meldungen</small>
                            </article>
                        </div>

                        <div className="statistics-grid">
                            <section className="statistics-card wide">
                                <div className="card-head">
                                    <h3>Statusverteilung</h3>
                                    <span>{stats.total} Meldungen</span>
                                </div>
                                <div className="bar-list">
                                    {stats.byStatus.map((item) => (
                                        <div key={item.label} className="bar-row">
                                            <div className="bar-row-labels">
                                                <span>{item.label}</span>
                                                <strong>{item.count}</strong>
                                            </div>
                                            <div className="bar-track">
                                                <div className="bar-fill blue" style={{ width: `${item.percentage}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="statistics-card">
                                <div className="card-head">
                                    <h3>Kernzahlen</h3>
                                </div>
                                <div className="mini-metrics">
                                    <div><span>Neu</span><strong>{stats.open}</strong></div>
                                    <div><span>Erledigt</span><strong>{stats.completed}</strong></div>
                                    <div><span>Abgelehnt</span><strong>{stats.rejected}</strong></div>
                                    <div><span>Mit Standort</span><strong>{stats.withLocation}</strong></div>
                                </div>
                            </section>

                            <section className="statistics-card">
                                <div className="card-head">
                                    <h3>Top-Kategorien</h3>
                                </div>
                                <div className="bar-list compact">
                                    {stats.topCategories.map((item) => (
                                        <div key={item.label} className="bar-row">
                                            <div className="bar-row-labels">
                                                <span>{item.label}</span>
                                                <strong>{item.count}</strong>
                                            </div>
                                            <div className="bar-track">
                                                <div className="bar-fill green" style={{ width: `${item.percentage}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    {stats.topCategories.length === 0 && <p>Keine Kategoriedaten vorhanden.</p>}
                                </div>
                            </section>

                            <section className="statistics-card">
                                <div className="card-head">
                                    <h3>Prioritäten</h3>
                                </div>
                                <div className="priority-pills">
                                    {stats.priorityMap.map((item) => (
                                        <div key={item.label} className="priority-pill-card">
                                            <span>{item.label}</span>
                                            <strong>{item.count}</strong>
                                            <small>{formatPercent(item.percentage)}</small>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="statistics-card wide">
                                <div className="card-head">
                                    <h3>Letzte Meldungen</h3>
                                </div>
                                <div className="latest-report-list">
                                    {stats.latestReports.map((report) => (
                                        <article key={report.id} className="latest-report-item">
                                            <div>
                                                <h4>{report.title || `Meldung #${report.id}`}</h4>
                                                <p>{report.address || report.description || "Keine Zusatzinformationen"}</p>
                                            </div>
                                            <div className="latest-report-meta">
                                                <span>{report.category || "-"}</span>
                                                <strong>{normalizeStatus(report.status)}</strong>
                                            </div>
                                        </article>
                                    ))}
                                    {stats.latestReports.length === 0 && <p>Keine Reports vorhanden.</p>}
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

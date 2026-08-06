import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, getReports, updateCurrentUser } from "../services/api";
import "../css/Settings.css";

const APP_VERSION = "v1.0.0";

export default function Settings() {
    const navigate = useNavigate();
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const isAdmin = currentUser?.role === "admin";
    const isCaseworker = currentUser?.role === "caseworker";

    const [form, setForm] = useState({
        displayName: "",
        email: "",
        password: "",
        language: localStorage.getItem("settings_language") || "de",
        emailNotifications: localStorage.getItem("settings_email_notifications") !== "false",
        pushNotifications: localStorage.getItem("settings_push_notifications") !== "false",
        compactMode: localStorage.getItem("settings_compact_mode") === "true",
        autoRefresh: localStorage.getItem("settings_auto_refresh") !== "false",
    });

    const [profile, setProfile] = useState(currentUser);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [reportStats, setReportStats] = useState({ total: 0, open: 0, done: 0, high: 0 });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const [userRes, reportsRes] = await Promise.all([getCurrentUser(), getReports()]);
                const user = userRes.data;
                const reports = Array.isArray(reportsRes.data) ? reportsRes.data : [];

                setProfile(user);
                setForm((prev) => ({
                    ...prev,
                    displayName: user?.name || "",
                    email: user?.email || "",
                    password: "",
                }));
                localStorage.setItem("user", JSON.stringify(user));

                setReportStats({
                    total: reports.length,
                    open: reports.filter((r) => String(r.status || "").toLowerCase() === "neu").length,
                    done: reports.filter((r) => String(r.status || "").toLowerCase() === "erledigt").length,
                    high: reports.filter((r) => String(r.priority || "").toLowerCase() === "high").length,
                });
            } catch (err) {
                setError(err?.response?.data?.message || err?.message || "Einstellungen konnten nicht geladen werden");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const roleLabel = useMemo(() => {
        if (profile?.role === "admin") return "Administrator";
        if (profile?.role === "caseworker") return "Sachbearbeiter";
        return "Benutzer";
    }, [profile?.role]);

    const onChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setMessage("");
    };

    const handlePushToggle = async (checked) => {
        if (checked && typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission !== "granted") {
                        setError("Push-Berechtigung wurde nicht erlaubt. Browser-Push bleibt deaktiviert.");
                        onChange("pushNotifications", false);
                        return;
                    }
                } catch {
                    setError("Push-Berechtigung konnte nicht abgefragt werden.");
                    onChange("pushNotifications", false);
                    return;
                }
            }

            if (Notification.permission === "denied") {
                setError("Push-Berechtigung ist im Browser blockiert. Bitte in Browser-Einstellungen erlauben.");
                onChange("pushNotifications", false);
                return;
            }
        }

        onChange("pushNotifications", checked);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        try {
            localStorage.setItem("settings_language", form.language);
            localStorage.setItem("settings_email_notifications", String(form.emailNotifications));
            localStorage.setItem("settings_push_notifications", String(form.pushNotifications));
            localStorage.setItem("settings_compact_mode", String(form.compactMode));
            localStorage.setItem("settings_auto_refresh", String(form.autoRefresh));

            const res = await updateCurrentUser({
                name: form.displayName.trim(),
                email: form.email.trim(),
                password: form.password.trim() || undefined,
            });

            const updatedUser = res.data?.user;
            setProfile(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setForm((prev) => ({ ...prev, password: "" }));

            setMessage("Einstellungen erfolgreich gespeichert.");
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Speichern fehlgeschlagen");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

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
                    {(isAdmin || isCaseworker) && <Link to="/categories" className="menu-item">🏷 Kategorien</Link>}
                    <Link to="/map" className="menu-item">🗺 Karte</Link>
                    <Link to="/notifications" className="menu-item">🔔 Benachrichtigungen</Link>
                    <Link to="/statistics" className="menu-item">📈 Statistiken</Link>
                    <Link to="/settings" className="menu-item active">⚙ Einstellungen</Link>
                </div>

                <div className="admin-box">
                    <div className="avatar">{String(profile?.name || currentUser?.name || "A").charAt(0).toUpperCase()}</div>
                    <div>
                        <h4>{profile?.name || currentUser?.name || "Benutzer"}</h4>
                        <p>{profile?.email || currentUser?.email || "-"}</p>
                    </div>
                </div>
            </div>

            <div className="settings-content">
                <div className="settings-header">
                    <div>
                        <h1>Einstellungen</h1>
                        <p>Verwalte Profil, Arbeitsansicht und Live-Systeminformationen.</p>
                    </div>
                    <div className="settings-actions">
                        <button className="save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? "Speichern..." : "Änderungen speichern"}
                        </button>
                        <button className="logout-btn" type="button" onClick={handleLogout}>
                            Abmelden
                        </button>
                    </div>
                </div>

                {loading && <p>⏳ Einstellungen werden geladen...</p>}
                {message && <p className="success-msg">✅ {message}</p>}
                {error && <p className="error-msg">❌ {error}</p>}

                <form className="settings-grid" onSubmit={handleSave}>
                    <section className="settings-card">
                        <h3>Profildaten</h3>

                        <label>Anzeigename</label>
                        <input
                            type="text"
                            value={form.displayName}
                            onChange={(e) => onChange("displayName", e.target.value)}
                        />

                        <label>E-Mail</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => onChange("email", e.target.value)}
                        />

                        <label>Neues Passwort</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={(e) => onChange("password", e.target.value)}
                            placeholder="Leer lassen, wenn unverändert"
                        />

                        <label>Sprache</label>
                        <select
                            value={form.language}
                            onChange={(e) => onChange("language", e.target.value)}
                        >
                            <option value="de">Deutsch</option>
                            <option value="en">English</option>
                        </select>
                    </section>

                    <section className="settings-card">
                        <h3>Benachrichtigungen im Browser</h3>

                        <div className="toggle-row">
                            <div>
                                <strong>E-Mail Benachrichtigungen</strong>
                                <p>Updates zu neuen Meldungen und Statusänderungen.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={form.emailNotifications}
                                onChange={(e) => onChange("emailNotifications", e.target.checked)}
                            />
                        </div>

                        <div className="toggle-row">
                            <div>
                                <strong>Push Benachrichtigungen</strong>
                                <p>Direkte Hinweise bei wichtigen Ereignissen.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={form.pushNotifications}
                                onChange={(e) => handlePushToggle(e.target.checked)}
                            />
                        </div>
                    </section>

                    <section className="settings-card">
                        <h3>Arbeitsansicht</h3>

                        <div className="toggle-row">
                            <div>
                                <strong>Kompakter Modus</strong>
                                <p>Zeigt mehr Datensätze auf kleinerem Raum.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={form.compactMode}
                                onChange={(e) => onChange("compactMode", e.target.checked)}
                            />
                        </div>

                        <div className="toggle-row">
                            <div>
                                <strong>Automatische Aktualisierung</strong>
                                <p>Lädt neue Daten regelmäßig im Hintergrund.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={form.autoRefresh}
                                onChange={(e) => onChange("autoRefresh", e.target.checked)}
                            />
                        </div>
                    </section>

                    <section className="settings-card metrics-card">
                        <h3>Live-Überblick</h3>
                        <div className="metric-box-grid">
                            <div className="metric-box"><span>Meldungen gesamt</span><strong>{reportStats.total}</strong></div>
                            <div className="metric-box"><span>Neu</span><strong>{reportStats.open}</strong></div>
                            <div className="metric-box"><span>Erledigt</span><strong>{reportStats.done}</strong></div>
                            <div className="metric-box"><span>Hohe Priorität</span><strong>{reportStats.high}</strong></div>
                        </div>
                    </section>

                    <section className="settings-card system-card">
                        <h3>Systeminformationen</h3>
                        <div className="info-line"><span>Rolle</span><strong>{roleLabel}</strong></div>
                        <div className="info-line"><span>Version</span><strong>{APP_VERSION}</strong></div>
                        <div className="info-line"><span>Konto-ID</span><strong>#{profile?.id ?? currentUser?.id ?? "-"}</strong></div>
                        <div className="info-line"><span>Konto erstellt</span><strong>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString("de-DE") : "-"}</strong></div>
                    </section>
                </form>
            </div>
        </div>
    );
}

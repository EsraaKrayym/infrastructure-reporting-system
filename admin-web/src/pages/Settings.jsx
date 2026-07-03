import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../css/Settings.css";

const APP_VERSION = "v1.0.0";

export default function Settings() {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const isAdmin = currentUser?.role === "admin";
    const isCaseworker = currentUser?.role === "caseworker";

    const [form, setForm] = useState({
        displayName: currentUser?.name || "",
        email: currentUser?.email || "",
        language: localStorage.getItem("settings_language") || "de",
        emailNotifications: localStorage.getItem("settings_email_notifications") !== "false",
        pushNotifications: localStorage.getItem("settings_push_notifications") !== "false",
        compactMode: localStorage.getItem("settings_compact_mode") === "true",
        autoRefresh: localStorage.getItem("settings_auto_refresh") !== "false",
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    const roleLabel = useMemo(() => {
        if (currentUser?.role === "admin") return "Administrator";
        if (currentUser?.role === "caseworker") return "Sachbearbeiter";
        return "Benutzer";
    }, [currentUser?.role]);

    const onChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setMessage("");
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);

        setTimeout(() => {
            localStorage.setItem("settings_language", form.language);
            localStorage.setItem("settings_email_notifications", String(form.emailNotifications));
            localStorage.setItem("settings_push_notifications", String(form.pushNotifications));
            localStorage.setItem("settings_compact_mode", String(form.compactMode));
            localStorage.setItem("settings_auto_refresh", String(form.autoRefresh));

            const updatedUser = {
                ...(currentUser || {}),
                name: form.displayName.trim() || currentUser?.name || "Benutzer",
                email: form.email.trim() || currentUser?.email || "",
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            setMessage("Einstellungen erfolgreich gespeichert.");
            setSaving(false);
        }, 450);
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
                    {isCaseworker && <Link to="/categories" className="menu-item">🏷 Kategorien</Link>}
                    <Link to="/map" className="menu-item">🗺 Karte</Link>
                    <Link to="/notifications" className="menu-item">🔔 Benachrichtigungen</Link>
                    <Link to="/statistics" className="menu-item">📈 Statistiken</Link>
                    <Link to="/settings" className="menu-item active">⚙ Einstellungen</Link>
                </div>

                <div className="admin-box">
                    <div className="avatar">{String(currentUser?.name || "A").charAt(0).toUpperCase()}</div>
                    <div>
                        <h4>{currentUser?.name || "Benutzer"}</h4>
                        <p>{currentUser?.email || "-"}</p>
                    </div>
                </div>
            </div>

            <div className="settings-content">
                <div className="settings-header">
                    <div>
                        <h1>Einstellungen</h1>
                        <p>Verwalte Konto, Benachrichtigungen und Systemoptionen.</p>
                    </div>
                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? "Speichern..." : "Änderungen speichern"}
                    </button>
                </div>

                {message && <p className="success-msg">✅ {message}</p>}

                <form className="settings-grid" onSubmit={handleSave}>
                    <section className="settings-card">
                        <h3>Profil</h3>

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
                        <h3>Benachrichtigungen</h3>

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
                                onChange={(e) => onChange("pushNotifications", e.target.checked)}
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

                    <section className="settings-card system-card">
                        <h3>Systeminformationen</h3>
                        <div className="info-line"><span>Rolle</span><strong>{roleLabel}</strong></div>
                        <div className="info-line"><span>Version</span><strong>{APP_VERSION}</strong></div>
                        <div className="info-line"><span>Konto-ID</span><strong>#{currentUser?.id ?? "-"}</strong></div>
                    </section>
                </form>
            </div>
        </div>
    );
}

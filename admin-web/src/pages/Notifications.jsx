import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers, getReports } from "../services/api";
import "../css/Notifications.css";

const formatDateTime = (value) => {
    if (!value) return "Unbekannt";
    return new Date(value).toLocaleString("de-DE");
};

const getEmailNotificationsEnabled = () => localStorage.getItem("settings_email_notifications") !== "false";
const getPushNotificationsEnabled = () => localStorage.getItem("settings_push_notifications") !== "false";

export default function Notifications() {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const isAdmin = currentUser?.role === "admin";
    const isCaseworker = currentUser?.role === "caseworker";

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [emailEnabled, setEmailEnabled] = useState(getEmailNotificationsEnabled());
    const [pushEnabled, setPushEnabled] = useState(getPushNotificationsEnabled());

    const initializedPushRef = useRef(false);

    const pushStorageKey = useMemo(() => {
        const role = isAdmin ? "admin" : isCaseworker ? "caseworker" : "other";
        return `web:seenNotificationIds:${role}`;
    }, [isAdmin, isCaseworker]);

    const triggerBrowserPushForNewItems = (nextItems) => {
        if (!pushEnabled) return;
        if (typeof window === "undefined" || !("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        const previousRaw = localStorage.getItem(pushStorageKey);
        const previousIds = previousRaw ? JSON.parse(previousRaw) : [];
        const prevSet = new Set(Array.isArray(previousIds) ? previousIds.map(String) : []);
        const nextIds = nextItems.map((item) => String(item.id));

        if (!initializedPushRef.current) {
            initializedPushRef.current = true;
            localStorage.setItem(pushStorageKey, JSON.stringify(nextIds.slice(0, 120)));
            return;
        }

        const newlyArrived = nextItems.filter((item) => !prevSet.has(String(item.id))).slice(0, 5);

        newlyArrived.forEach((item) => {
            try {
                new Notification(item.title, { body: item.message });
            } catch {
                // ignore browser notification errors
            }
        });

        localStorage.setItem(pushStorageKey, JSON.stringify(nextIds.slice(0, 120)));
    };

    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const emailSetting = getEmailNotificationsEnabled();
            const pushSetting = getPushNotificationsEnabled();
            setEmailEnabled(emailSetting);
            setPushEnabled(pushSetting);

            if (!emailSetting) {
                setItems([]);
                setLastUpdated(new Date());
                setLoading(false);
                return;
            }

            let notifications = [];

            if (isAdmin) {
                const res = await getUsers();
                const users = Array.isArray(res.data) ? res.data : [];

                notifications = users
                    .filter((u) => u.role !== "admin")
                    .slice(0, 30)
                    .map((u) => ({
                        id: `user-${u.id}`,
                        type: "user_registered",
                        title: "Neue Registrierung",
                        message: `${u.name || "Benutzer"} (${u.email}) hat sich registriert.`,
                        time: u.created_at || null,
                        meta: `Benutzer-ID #${u.id}`,
                    }));
            } else if (isCaseworker) {
                const res = await getReports();
                const reports = Array.isArray(res.data) ? res.data : [];

                notifications = reports
                    .filter((r) => ["neu", "open", "pending"].includes(String(r.status || "").toLowerCase()))
                    .slice(0, 40)
                    .map((r) => ({
                        id: `report-${r.id}`,
                        type: "new_report",
                        title: "Neue Bürgermeldung",
                        message: `${r.title || "Neue Meldung"} wurde erstellt.`,
                        time: r.created_at || null,
                        meta: `Report #${r.id} • Bürger-ID #${r.user_id ?? "?"}`,
                    }));
            } else {
                notifications = [];
            }

            setItems(notifications);
            triggerBrowserPushForNewItems(notifications);

            setLastUpdated(new Date());
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Benachrichtigungen konnten nicht geladen werden");
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();

        const autoRefreshEnabled = localStorage.getItem("settings_auto_refresh") !== "false";
        if (!autoRefreshEnabled || !emailEnabled) {
            return undefined;
        }

        const t = setInterval(loadNotifications, 15000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin, isCaseworker, emailEnabled]);

    const headline = useMemo(() => {
        if (isAdmin) return "Admin-Benachrichtigungen";
        if (isCaseworker) return "Sachbearbeiter-Benachrichtigungen";
        return "Benachrichtigungen";
    }, [isAdmin, isCaseworker]);

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
                    <Link to="/map" className="menu-item">🗺 Map</Link>
                    <Link to="/notifications" className="menu-item active">🔔 Benachrichtigungen</Link>
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

            <div className="notifications-content">
                <div className="notifications-header">
                    <div>
                        <h1>{headline}</h1>
                        <p>
                            {isAdmin && "Du siehst neue Benutzer-Registrierungen."}
                            {isCaseworker && "Du siehst neue Bürgermeldungen."}
                            {!isAdmin && !isCaseworker && "Keine Benachrichtigungen für diese Rolle."}
                        </p>
                        <p style={{ marginTop: 8, color: "#475569", fontSize: 13 }}>
                            E-Mail: {emailEnabled ? "Aktiv" : "Deaktiviert"} • Push: {pushEnabled ? "Aktiv" : "Deaktiviert"}
                        </p>
                    </div>

                    <button className="refresh-btn" onClick={loadNotifications} disabled={loading}>
                        {loading ? "Lädt..." : "Aktualisieren"}
                    </button>
                </div>

                {lastUpdated && !loading && !error && (
                    <p className="updated-text">
                        Zuletzt aktualisiert: {new Date(lastUpdated).toLocaleTimeString("de-DE")}
                    </p>
                )}

                {loading && <p>⏳ Benachrichtigungen werden geladen...</p>}
                {!loading && error && <p className="error">❌ {error}</p>}

                {!loading && !error && items.length === 0 && (
                    <div className="empty-card">
                        <h3>{emailEnabled ? "Keine neuen Benachrichtigungen" : "Benachrichtigungen deaktiviert"}</h3>
                        <p>
                            {emailEnabled
                                ? "Aktuell gibt es keine neuen Ereignisse für deine Rolle."
                                : "Aktiviere E-Mail Benachrichtigungen in den Einstellungen, um neue Einträge zu erhalten."}
                        </p>
                    </div>
                )}

                <div className="notification-list">
                    {!loading && !error && items.map((item) => (
                        <article key={item.id} className="notification-card">
                            <div className={`dot ${item.type}`} />
                            <div className="notification-main">
                                <h3>{item.title}</h3>
                                <p>{item.message}</p>
                                <div className="meta-row">
                                    <span>{item.meta}</span>
                                    <span>{formatDateTime(item.time)}</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}

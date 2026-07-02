import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    getUsers,
    createCaseworker,
    toggleBlockUser,
    deleteUser
} from "../services/api";
import "../css/Benutzer.css";

export default function Benutzer() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("alle");
    const [statusFilter, setStatusFilter] = useState("alle");

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "caseworker"
    });

    const currentUser = JSON.parse(localStorage.getItem("user") || "null");

    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await getUsers();
            setUsers(Array.isArray(res.data) ? res.data : []);
            setError("");
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Benutzer konnten nicht geladen werden"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const roleLabel = (role) => {
        if (role === "admin") return "Administrator";
        if (role === "caseworker") return "Sachbearbeiter";
        return "Bürger";
    };

    const statusLabel = (blocked) => (blocked ? "Gesperrt" : "Aktiv");

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const query = search.trim().toLowerCase();
            const matchesSearch = !query ||
                String(u.name || "").toLowerCase().includes(query) ||
                String(u.email || "").toLowerCase().includes(query) ||
                String(u.id || "").includes(query);

            const matchesRole =
                roleFilter === "alle" ||
                String(u.role || "") === roleFilter;

            const userStatus = u.blocked ? "gesperrt" : "aktiv";
            const matchesStatus =
                statusFilter === "alle" ||
                userStatus === statusFilter;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, search, roleFilter, statusFilter]);

    const handleToggleBlock = async (user) => {
        if (currentUser?.id === user.id) {
            alert("Du kannst deinen eigenen Admin-Account nicht blockieren.");
            return;
        }

        try {
            await toggleBlockUser(user.id);
            await loadUsers();
        } catch (err) {
            alert(err?.response?.data?.message || "Blockieren fehlgeschlagen");
        }
    };

    const handleDeleteUser = async (user) => {
        if (currentUser?.id === user.id) {
            alert("Du kannst deinen eigenen Admin-Account nicht löschen.");
            return;
        }

        const ok = window.confirm(`Benutzer ${user.name} wirklich löschen?`);
        if (!ok) return;

        try {
            await deleteUser(user.id);
            await loadUsers();
        } catch (err) {
            alert(err?.response?.data?.message || "Löschen fehlgeschlagen");
        }
    };

    const handleCreateCaseworker = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            await createCaseworker(form);
            setShowModal(false);
            setForm({ firstName: "", lastName: "", email: "", password: "", role: "caseworker" });
            await loadUsers();
        } catch (err) {
            alert(err?.response?.data?.message || "Erstellen fehlgeschlagen");
        } finally {
            setSaving(false);
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

                    <Link to="/dashboard" className="menu-item">
                        📊 Dashboard
                    </Link>

                    <Link to="/reports" className="menu-item">
                        📋 Meldungen
                    </Link>

                    <Link to="/users" className="menu-item active">
                        👥 Benutzer
                    </Link>

                    <Link to="/categories" className="menu-item">
                        🏷 Kategorien
                    </Link>

                    <Link to="/map" className="menu-item">
                        🗺 Karte
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

            {/* CONTENT */}
            <div className="users-content">

                <div className="users-header">

                    <div>
                        <h1>Benutzerverwaltung</h1>
                        <p>
                            Verwaltung aller registrierten Nutzer
                        </p>
                    </div>

                    <button
                        className="add-user-btn"
                        onClick={() => setShowModal(true)}
                    >
                        ➕ Benutzer hinzufügen
                    </button>

                </div>

                <div className="filters">

                    <input
                        type="text"
                        placeholder="Benutzer suchen..."
                        className="search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="alle">Alle Rollen</option>
                        <option value="citizen">Bürger</option>
                        <option value="caseworker">Sachbearbeiter</option>
                        <option value="admin">Administrator</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="alle">Alle Status</option>
                        <option value="aktiv">Aktiv</option>
                        <option value="gesperrt">Gesperrt</option>
                    </select>

                </div>

                <div className="table-card">

                    <table>

                        <thead>
                        <tr>
                            <th>Benutzer</th>
                            <th>E-Mail</th>
                            <th>Rolle</th>
                            <th>Status</th>
                            <th>Aktionen</th>
                        </tr>
                        </thead>

                        <tbody>

                        {loading && (
                            <tr>
                                <td colSpan="5">⏳ Benutzer werden geladen...</td>
                            </tr>
                        )}

                        {!loading && error && (
                            <tr>
                                <td colSpan="5" className="table-error">❌ {error}</td>
                            </tr>
                        )}

                        {!loading && !error && filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan="5">Keine Benutzer gefunden.</td>
                            </tr>
                        )}

                        {!loading && !error && filteredUsers.map(user => (

                            <tr key={user.id}>

                                <td>
                                    <div className="user-name">{user.name}</div>
                                    <div className="user-id">ID #{user.id}</div>
                                </td>

                                <td>{user.email}</td>

                                <td>
                                    <span className="role-badge">
                                        {roleLabel(user.role)}
                                    </span>
                                </td>

                                <td>
                                    <span className={`status-badge ${user.blocked ? "blocked" : "active"}`}>
                                        {statusLabel(user.blocked)}
                                    </span>
                                </td>

                                <td>
                                    <button
                                        className="edit-btn"
                                        onClick={() => handleToggleBlock(user)}
                                    >
                                        {user.blocked ? "Entsperren" : "Blockieren"}
                                    </button>

                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDeleteUser(user)}
                                    >
                                        Löschen
                                    </button>
                                </td>

                            </tr>

                        ))}

                        </tbody>

                    </table>

                </div>

            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>➕ Benutzer hinzufügen</h3>
                            <button
                                className="modal-close"
                                onClick={() => !saving && setShowModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <p className="modal-subtitle">
                            Bitte Vorname, Nachname, E-Mail, Passwort und Rolle eingeben.
                        </p>

                        <form onSubmit={handleCreateCaseworker} className="modal-form">
                            <div className="form-row">
                                <input
                                    type="text"
                                    placeholder="Vorname"
                                    value={form.firstName}
                                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                                    required
                                />

                                <input
                                    type="text"
                                    placeholder="Nachname"
                                    value={form.lastName}
                                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                                    required
                                />
                            </div>

                            <input
                                type="email"
                                placeholder="E-Mail"
                                value={form.email}
                                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                                required
                            />

                            <input
                                type="password"
                                placeholder="Passwort (mind. 6 Zeichen)"
                                value={form.password}
                                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                minLength={6}
                                required
                            />

                            <select
                                value={form.role}
                                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                                required
                            >
                                <option value="caseworker">Sachbearbeiter</option>
                                <option value="admin">Administrator</option>
                                <option value="citizen">Bürger</option>
                            </select>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => !saving && setShowModal(false)}
                                >
                                    Abbrechen
                                </button>

                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? "Speichern..." : "Speichern"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
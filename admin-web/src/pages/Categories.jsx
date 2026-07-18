import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../services/api";
import "../css/Categories.css";

const slugify = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[ä]/g, "ae")
        .replace(/[ö]/g, "oe")
        .replace(/[ü]/g, "ue")
        .replace(/[ß]/g, "ss")
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

export default function Categories() {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const isAdmin = currentUser?.role === "admin";
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [form, setForm] = useState({
        name: "",
        description: "",
    });

    const loadCategories = async () => {
        try {
            setLoading(true);
            const res = await getCategories();
            setCategories(Array.isArray(res.data) ? res.data : []);
            setError("");
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Kategorien konnten nicht geladen werden");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const filtered = useMemo(() => {
        return categories.filter((c) => {
            const q = search.trim().toLowerCase();
            const matchesSearch =
                !q ||
                c.name.toLowerCase().includes(q) ||
                slugify(c.name).includes(q) ||
                c.description.toLowerCase().includes(q);

            return matchesSearch;
        });
    }, [categories, search]);

    const totals = useMemo(() => {
        const total = categories.length;
        const reports = categories.reduce((sum, c) => sum + Number(c.report_count || 0), 0);
        const used = categories.filter((c) => Number(c.report_count || 0) > 0).length;
        return { total, used, reports };
    }, [categories]);

    const handleDelete = async (id) => {
        const item = categories.find((c) => c.id === id);
        const ok = window.confirm(`Kategorie "${item?.name}" wirklich löschen?`);
        if (!ok) return;

        try {
            await deleteCategory(id);
            await loadCategories();
        } catch (err) {
            alert(err?.response?.data?.message || "Kategorie konnte nicht gelöscht werden");
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setForm({
            name: category.name || "",
            description: category.description || "",
        });
        setShowModal(true);
    };

    const resetModal = () => {
        setForm({ name: "", description: "" });
        setEditingCategory(null);
        setShowModal(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, {
                    name: form.name.trim(),
                    description: form.description.trim(),
                });
            } else {
                await createCategory({
                    name: form.name.trim(),
                    description: form.description.trim(),
                });
            }

            await loadCategories();
            resetModal();
        } catch (err) {
            alert(err?.response?.data?.message || "Kategorie konnte nicht gespeichert werden");
        } finally {
            setSaving(false);
        }
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
                    <Link to="/categories" className="menu-item active">🏷 Kategorien</Link>
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

            <div className="categories-content">
                <div className="categories-header">
                    <div>
                        <h1>Kategorienverwaltung</h1>
                        <p>Verwalte echte Meldungskategorien aus der Datenbank.</p>
                    </div>

                    <button className="add-category-btn" onClick={() => setShowModal(true)}>
                        ➕ Kategorie hinzufügen
                    </button>
                </div>

                <div className="stats-row">
                    <div className="stat-card">
                        <h4>Gesamt Kategorien</h4>
                        <h2>{totals.total}</h2>
                    </div>
                    <div className="stat-card">
                        <h4>Verwendete Kategorien</h4>
                        <h2>{totals.used}</h2>
                    </div>
                    <div className="stat-card">
                        <h4>Meldungen gesamt</h4>
                        <h2>{totals.reports}</h2>
                    </div>
                </div>

                <div className="filters">
                    <input
                        type="text"
                        placeholder="Kategorie suchen..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="table-card">
                    <table>
                        <thead>
                        <tr>
                            <th>Kategorie</th>
                            <th>Slug</th>
                            <th>Reports</th>
                            <th>Aktionen</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading && (
                            <tr>
                                <td colSpan="4">⏳ Kategorien werden geladen...</td>
                            </tr>
                        )}

                        {!loading && error && (
                            <tr>
                                <td colSpan="4">❌ {error}</td>
                            </tr>
                        )}

                        {!loading && !error && filtered.length === 0 && (
                            <tr>
                                <td colSpan="4">Keine Kategorien gefunden.</td>
                            </tr>
                        )}

                        {!loading && !error && filtered.map((category) => (
                            <tr key={category.id}>
                                <td>
                                    <div className="cat-name">{category.name}</div>
                                    <div className="cat-desc">{category.description}</div>
                                </td>

                                <td>
                                    <code className="slug-chip">{slugify(category.name)}</code>
                                </td>

                                <td>{category.report_count ?? 0}</td>

                                <td>
                                    <button
                                        className="toggle-btn"
                                        onClick={() => handleEdit(category)}
                                    >
                                        Bearbeiten
                                    </button>

                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(category.id)}
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
                <div className="modal-overlay" onClick={() => !saving && resetModal()}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingCategory ? "🏷 Kategorie bearbeiten" : "🏷 Neue Kategorie"}</h3>
                            <button
                                className="modal-close"
                                onClick={() => !saving && resetModal()}
                            >
                                ✕
                            </button>
                        </div>

                        <p className="modal-subtitle">Die Änderungen werden direkt in der Datenbank gespeichert.</p>

                        <form className="modal-form" onSubmit={handleCreate}>
                            <input
                                type="text"
                                placeholder="Name (z. B. Straßenschäden)"
                                value={form.name}
                                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                required
                            />

                            <textarea
                                placeholder="Beschreibung"
                                value={form.description}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                rows={4}
                                required
                            />

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => !saving && resetModal()}
                                >
                                    Abbrechen
                                </button>

                                <button className="btn-primary" type="submit" disabled={saving}>
                                    {saving ? "Speichern..." : editingCategory ? "Änderungen speichern" : "Speichern"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../css/Categories.css";

const INITIAL_CATEGORIES = [
    {
        id: 1,
        name: "Straßenschäden",
        slug: "road_damage",
        description: "Schlaglöcher, Risse und beschädigte Fahrbahnen",
        priority: "Hoch",
        active: true,
        reports: 28,
    },
    {
        id: 2,
        name: "Beleuchtung",
        slug: "street_light",
        description: "Defekte Straßenlampen und schlechte Beleuchtung",
        priority: "Mittel",
        active: true,
        reports: 14,
    },
    {
        id: 3,
        name: "Müll & Sauberkeit",
        slug: "waste",
        description: "Illegale Müllablagerung, überfüllte Mülleimer",
        priority: "Mittel",
        active: true,
        reports: 19,
    },
    {
        id: 4,
        name: "Sonstiges",
        slug: "other",
        description: "Weitere Infrastruktur-Meldungen",
        priority: "Niedrig",
        active: false,
        reports: 7,
    },
];

export default function Categories() {
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("alle");

    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: "",
        priority: "Mittel",
    });

    const filtered = useMemo(() => {
        return categories.filter((c) => {
            const q = search.trim().toLowerCase();
            const matchesSearch =
                !q ||
                c.name.toLowerCase().includes(q) ||
                c.slug.toLowerCase().includes(q) ||
                c.description.toLowerCase().includes(q);

            const matchesStatus =
                statusFilter === "alle" ||
                (statusFilter === "aktiv" && c.active) ||
                (statusFilter === "inaktiv" && !c.active);

            return matchesSearch && matchesStatus;
        });
    }, [categories, search, statusFilter]);

    const totals = useMemo(() => {
        const total = categories.length;
        const active = categories.filter((c) => c.active).length;
        const reports = categories.reduce((sum, c) => sum + c.reports, 0);
        return { total, active, reports };
    }, [categories]);

    const handleToggleActive = (id) => {
        setCategories((prev) =>
            prev.map((c) =>
                c.id === id ? { ...c, active: !c.active } : c
            )
        );
    };

    const handleDelete = (id) => {
        const item = categories.find((c) => c.id === id);
        const ok = window.confirm(`Kategorie "${item?.name}" wirklich löschen?`);
        if (!ok) return;
        setCategories((prev) => prev.filter((c) => c.id !== id));
    };

    const handleCreate = (e) => {
        e.preventDefault();
        setSaving(true);

        const slug =
            form.slug.trim() ||
            form.name
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^a-z0-9_]/g, "");

        setTimeout(() => {
            setCategories((prev) => [
                {
                    id: Date.now(),
                    name: form.name.trim(),
                    slug,
                    description: form.description.trim(),
                    priority: form.priority,
                    active: true,
                    reports: 0,
                },
                ...prev,
            ]);

            setForm({
                name: "",
                slug: "",
                description: "",
                priority: "Mittel",
            });
            setSaving(false);
            setShowModal(false);
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
                    <Link to="/users" className="menu-item">👥 Benutzer</Link>
                    <Link to="/categories" className="menu-item active">🏷 Kategorien</Link>
                    <Link to="/map" className="menu-item">🗺 Map</Link>
                    <Link to="/notifications" className="menu-item">🔔 Benachrichtigungen</Link>
                    <Link to="/statistics" className="menu-item">📈 Statistiken</Link>
                    <Link to="/settings" className="menu-item">⚙ Einstellungen</Link>
                </div>

                <div className="admin-box">
                    <div className="avatar">A</div>
                    <div>
                        <h4>Administrator</h4>
                        <p>admin@cityreport.de</p>
                    </div>
                </div>
            </div>

            <div className="categories-content">
                <div className="categories-header">
                    <div>
                        <h1>Kategorienverwaltung</h1>
                        <p>Verwalte Meldungskategorien, Prioritäten und Status.</p>
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
                        <h4>Aktive Kategorien</h4>
                        <h2>{totals.active}</h2>
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

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="alle">Alle Status</option>
                        <option value="aktiv">Aktiv</option>
                        <option value="inaktiv">Inaktiv</option>
                    </select>
                </div>

                <div className="table-card">
                    <table>
                        <thead>
                        <tr>
                            <th>Kategorie</th>
                            <th>Slug</th>
                            <th>Priorität</th>
                            <th>Status</th>
                            <th>Reports</th>
                            <th>Aktionen</th>
                        </tr>
                        </thead>

                        <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="6">Keine Kategorien gefunden.</td>
                            </tr>
                        )}

                        {filtered.map((category) => (
                            <tr key={category.id}>
                                <td>
                                    <div className="cat-name">{category.name}</div>
                                    <div className="cat-desc">{category.description}</div>
                                </td>

                                <td>
                                    <code className="slug-chip">{category.slug}</code>
                                </td>

                                <td>
                                    <span className={`priority-badge ${category.priority.toLowerCase()}`}>
                                        {category.priority}
                                    </span>
                                </td>

                                <td>
                                    <span className={`status-badge ${category.active ? "active" : "inactive"}`}>
                                        {category.active ? "Aktiv" : "Inaktiv"}
                                    </span>
                                </td>

                                <td>{category.reports}</td>

                                <td>
                                    <button
                                        className="toggle-btn"
                                        onClick={() => handleToggleActive(category.id)}
                                    >
                                        {category.active ? "Deaktivieren" : "Aktivieren"}
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
                <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>🏷 Neue Kategorie</h3>
                            <button
                                className="modal-close"
                                onClick={() => !saving && setShowModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <p className="modal-subtitle">Lege eine neue Kategorie für eingehende Meldungen an.</p>

                        <form className="modal-form" onSubmit={handleCreate}>
                            <input
                                type="text"
                                placeholder="Name (z. B. Straßenschäden)"
                                value={form.name}
                                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                required
                            />

                            <input
                                type="text"
                                placeholder="Slug (optional, z. B. road_damage)"
                                value={form.slug}
                                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                            />

                            <textarea
                                placeholder="Beschreibung"
                                value={form.description}
                                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                rows={4}
                                required
                            />

                            <select
                                value={form.priority}
                                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                            >
                                <option>Niedrig</option>
                                <option>Mittel</option>
                                <option>Hoch</option>
                            </select>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => !saving && setShowModal(false)}
                                >
                                    Abbrechen
                                </button>

                                <button className="btn-primary" type="submit" disabled={saving}>
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

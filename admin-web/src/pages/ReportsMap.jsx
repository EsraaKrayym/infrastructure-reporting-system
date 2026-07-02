import { useEffect, useMemo, useState } from "react";
import { getReports } from "../services/api";

import { Link } from "react-router-dom";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "../css/ReportsMap.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

export default function ReportsMap({ token }) {

    const [reports, setReports] = useState([]);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("alle");
    const [statusFilter, setStatusFilter] = useState("alle");

    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const isAdmin = currentUser?.role === "admin";
    const isCaseworker = currentUser?.role === "caseworker";

    useEffect(() => {
        const loadReports = async () => {
            try {
                const res = await getReports(token);
                setReports(res.data);
            } catch (error) {
                console.error(error);
            }
        };

        loadReports();
    }, [token]);

    const normalizeStatus = (status) => {
        const s = String(status || "").toLowerCase();
        if (["neu", "open", "pending"].includes(s)) return "neu";
        if (["in bearbeitung", "in_progress", "in progress", "in_review"].includes(s)) return "in_bearbeitung";
        if (["erledigt", "repaired", "done", "fixed"].includes(s)) return "erledigt";
        return "other";
    };

    const categoryOptions = useMemo(() => {
        const values = Array.from(
            new Set(reports.map((r) => String(r.category || "Allgemein").trim()).filter(Boolean))
        );
        return values.sort((a, b) => a.localeCompare(b));
    }, [reports]);

    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            const query = search.trim().toLowerCase();
            const matchesSearch =
                !query ||
                String(report.title || "").toLowerCase().includes(query) ||
                String(report.description || "").toLowerCase().includes(query) ||
                String(report.category || "").toLowerCase().includes(query) ||
                String(report.address || "").toLowerCase().includes(query) ||
                String(report.id || "").includes(query);

            const category = String(report.category || "Allgemein").trim();
            const matchesCategory = categoryFilter === "alle" || category === categoryFilter;

            const normalized = normalizeStatus(report.status);
            const matchesStatus = statusFilter === "alle" || normalized === statusFilter;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [reports, search, categoryFilter, statusFilter]);

    const reportsWithCoords = useMemo(() => {
        return filteredReports.filter((r) => {
            const lat = Number(r.latitude);
            const lng = Number(r.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
        });
    }, [filteredReports]);

    const mapCenter = useMemo(() => {
        if (reportsWithCoords.length > 0) {
            return [Number(reportsWithCoords[0].latitude), Number(reportsWithCoords[0].longitude)];
        }
        return [52.52, 13.405];
    }, [reportsWithCoords]);

    const exportCsv = () => {
        const rows = filteredReports.map((r) => ({
            id: r.id ?? "",
            title: r.title ?? "",
            description: r.description ?? "",
            category: r.category ?? "",
            address: r.address ?? "",
            status: r.status ?? "",
            priority: r.priority ?? "",
            user_id: r.user_id ?? "",
            latitude: r.latitude ?? "",
            longitude: r.longitude ?? "",
            created_at: r.created_at ?? "",
            photo: r.photo ?? ""
        }));

        const headers = Object.keys(rows[0] || {
            id: "",
            title: "",
            description: "",
            category: "",
            address: "",
            status: "",
            priority: "",
            user_id: "",
            latitude: "",
            longitude: "",
            created_at: "",
            photo: ""
        });

        const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        const csv = [
            headers.join(","),
            ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const now = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
        a.href = url;
        a.download = `reports-map-export-${now}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="layout">

            {/* SIDEBAR */}
            <div className="sidebar">

                <div className="sidebar-header">
                    <h1>CityReport</h1>
                </div>

                <div className="menu">

                    <Link
                        to="/dashboard"
                        className="menu-item"
                    >
                        📊 Dashboard
                    </Link>

                    <Link
                        to="/reports"
                        className="menu-item"
                    >
                        📋 Meldungen
                    </Link>

                    {isAdmin && (
                        <Link
                            to="/users"
                            className="menu-item"
                        >
                            👥 Benutzer
                        </Link>
                    )}

                    {isCaseworker && (
                        <Link
                            to="/categories"
                            className="menu-item"
                        >
                            🏷 Kategorien
                        </Link>
                    )}

                    <Link
                        to="/map"
                        className="menu-item active"
                    >
                        🗺 Map
                    </Link>

                    <Link
                        to="/notifications"
                        className="menu-item"
                    >
                        🔔 Benachrichtigungen
                    </Link>

                    <Link
                        to="/statistics"
                        className="menu-item"
                    >
                        📈 Statistiken
                    </Link>

                    <Link
                        to="/settings"
                        className="menu-item"
                    >
                        ⚙ Einstellungen
                    </Link>

                </div>

                <div className="admin-box">

                    <div className="avatar">
                        A
                    </div>

                    <div>
                        <h4>Administrator</h4>
                        <p>admin@cityreport.de</p>
                    </div>

                </div>

            </div>

            {/* CONTENT */}
            <div className="main-content">

                <div className="page-header">
                    <h1>Meldungskarte</h1>
                    <p>
                        Alle Bürgermeldungen auf der Karte anzeigen
                    </p>
                </div>

                <div className="filters">

                    <input
                        type="text"
                        placeholder="Meldungen, Kategorien oder Orte suchen..."
                        className="search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <div className="filter-row">

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="alle">Alle Kategorien</option>
                            {categoryOptions.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="alle">Alle Status</option>
                            <option value="neu">Neu</option>
                            <option value="in_bearbeitung">In Bearbeitung</option>
                            <option value="erledigt">Erledigt</option>
                        </select>

                        <button className="export-btn" onClick={exportCsv}>
                            CSV Export
                        </button>

                    </div>

                </div>

                <div className="map-card">

                    <div className="map-info">
                        📍 {reportsWithCoords.length} von {filteredReports.length} gefilterten Meldungen auf der Karte
                    </div>

                    {reportsWithCoords.length === 0 ? (
                        <div className="empty-map">
                            Keine Meldungen mit Koordinaten für den aktuellen Filter.
                        </div>
                    ) : (
                        <MapContainer
                            center={mapCenter}
                            zoom={12}
                            className="leaflet-map"
                        >

                            <TileLayer
                                attribution="&copy; OpenStreetMap"
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {reportsWithCoords.map(report => (

                                <Marker
                                    key={report.id}
                                    position={[
                                        Number(report.latitude),
                                        Number(report.longitude)
                                    ]}
                                >

                                    <Popup>

                                        <h3>
                                            {report.title || `Meldung #${report.id}`}
                                        </h3>

                                        <p>
                                            {report.description || "Keine Beschreibung"}
                                        </p>

                                        <p><strong>Status:</strong> {report.status || "-"}</p>
                                        <p><strong>Kategorie:</strong> {report.category || "-"}</p>
                                        <p><strong>Adresse:</strong> {report.address || "-"}</p>

                                    </Popup>

                                </Marker>

                            ))}

                        </MapContainer>
                    )}

                </div>

            </div>

        </div>
    );
}
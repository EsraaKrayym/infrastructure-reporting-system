import { useEffect, useState } from "react";
import { getReports } from "../services/api";

import { Link } from "react-router-dom";

import {
    MapContainer,
    TileLayer,
    Marker,
    Popup
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "../css/ReportsMap.css";

export default function ReportsMap({ token }) {

    const [reports, setReports] = useState([]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);
    const loadReports = async () => {
        try {
            const res = await getReports(token);
            setReports(res.data);
        } catch (error) {
            console.error(error);
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

                    <Link
                        to="/users"
                        className="menu-item"
                    >
                        👥 Benutzer
                    </Link>

                    <Link
                        to="/categories"
                        className="menu-item"
                    >
                        🏷 Kategorien
                    </Link>

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
                    />

                    <div className="filter-row">

                        <select>
                            <option>
                                Alle Kategorien
                            </option>

                            <option>
                                Straßen
                            </option>

                            <option>
                                Beleuchtung
                            </option>

                            <option>
                                Müll
                            </option>
                        </select>

                        <select>
                            <option>
                                Alle Status
                            </option>

                            <option>
                                Neu
                            </option>

                            <option>
                                In Bearbeitung
                            </option>

                            <option>
                                Erledigt
                            </option>
                        </select>

                        <button className="export-btn">
                            CSV Export
                        </button>

                    </div>

                </div>

                <div className="map-card">

                    <div className="map-info">
                        📍 {reports.length} Meldungen auf der Karte
                    </div>

                    <MapContainer
                        center={[52.5200, 13.4050]}
                        zoom={12}
                        className="leaflet-map"
                    >

                        <TileLayer
                            attribution="&copy; OpenStreetMap"
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {reports
                            .filter(
                                report =>
                                    report.latitude &&
                                    report.longitude
                            )
                            .map(report => (

                                <Marker
                                    key={report.id}
                                    position={[
                                        Number(report.latitude),
                                        Number(report.longitude)
                                    ]}
                                >

                                    <Popup>

                                        <h3>
                                            {report.title}
                                        </h3>

                                        <p>
                                            {report.description}
                                        </p>

                                        <p>
                                            Status:
                                            {" "}
                                            {report.status}
                                        </p>

                                    </Popup>

                                </Marker>

                            ))}

                    </MapContainer>

                </div>

            </div>

        </div>
    );
}
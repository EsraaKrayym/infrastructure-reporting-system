import { useState } from "react";
import { Link } from "react-router-dom";
import "../css/Benutzer.css";

export default function Benutzer() {

    const [users] = useState([
        {
            id: 1,
            name: "Max Mustermann",
            email: "max@test.de",
            role: "Bürger",
            status: "Aktiv"
        },
        {
            id: 2,
            name: "Anna Müller",
            email: "anna@test.de",
            role: "Sachbearbeiter",
            status: "Aktiv"
        },
        {
            id: 3,
            name: "Administrator",
            email: "admin@cityreport.de",
            role: "Administrator",
            status: "Aktiv"
        }
    ]);

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

                    <button className="add-user-btn">
                        ➕ Benutzer hinzufügen
                    </button>

                </div>

                <div className="filters">

                    <input
                        type="text"
                        placeholder="Benutzer suchen..."
                        className="search-input"
                    />

                    <select>
                        <option>Alle Rollen</option>
                        <option>Bürger</option>
                        <option>Sachbearbeiter</option>
                        <option>Administrator</option>
                    </select>

                    <select>
                        <option>Alle Status</option>
                        <option>Aktiv</option>
                        <option>Inaktiv</option>
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

                        {users.map(user => (

                            <tr key={user.id}>

                                <td>{user.name}</td>

                                <td>{user.email}</td>

                                <td>
                                    <span className="role-badge">
                                        {user.role}
                                    </span>
                                </td>

                                <td>
                                    <span className="status-badge">
                                        {user.status}
                                    </span>
                                </td>

                                <td>
                                    <button className="edit-btn">
                                        Bearbeiten
                                    </button>

                                    <button className="delete-btn">
                                        Löschen
                                    </button>
                                </td>

                            </tr>

                        ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}
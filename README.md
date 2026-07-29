# 🌍 Infrastructure Reporting System

Ein vollständiges System zur Verwaltung von Bürgermeldungen über Infrastruktur-Probleme (Straßenschäden, Straßenlaternen, etc.) mit **Web-Admin-Interface** und **Mobile-App**.

## 📋 Projektübersicht

Das System besteht aus **3 Komponenten**:

1. **Backend** - Node.js Express API mit PostgreSQL Datenbank
2. **Admin-Web** - React Web-Interface für Verwaltung und Verarbeitung
3. **Mobile-App** - React Native Expo App für Bürgermeldungen

## 🌐 Live Links

- **Admin-Web (Vercel):** https://infrastructure-reporting-system.vercel.app
- **Backend API (Render):** https://cityreport-backend.onrender.com

---

## 🛠️ Voraussetzungen

Stelle sicher, dass du folgende Tools installiert hast:

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** oder **yarn** (kommt mit Node.js)
- **PostgreSQL** 12+ (für Backend, oder nutze Cloud-DB)
- **Git** (optional, für Versionskontrolle)

Prüfe die Installation:
```bash
node --version
npm --version
```

---

## ⚙️ Umgebungsvariablen konfigurieren

### Backend (.env)

Erstelle eine `.env` Datei im `backend/` Ordner:

```env
# Server
PORT=5000
NODE_ENV=development

# JWT Authentifizierung
JWT_SECRET=your-super-secret-key-change-this

# Optional: Standard-Admin beim Serverstart
DEFAULT_ADMIN_EMAIL=admin@cityreport.de
DEFAULT_ADMIN_PASSWORD=123456
DEFAULT_ADMIN_NAME=Administrator

# PostgreSQL Datenbank (Cloud URL)
DATABASE_URL=postgresql://user:password@host:port/database

# oder lokal:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/infrastructure_db
```

### Mobile-App (.env)

Optional im `mobile-app/` Ordner eine `.env` Datei erstellen:

```env
EXPO_PUBLIC_API_URL=https://cityreport-backend.onrender.com/api
```

Falls nicht gesetzt, nutzt die App bereits standardmäßig diese URL.

---

## 📦 Installation & Setup

### 1️⃣ Backend starten

```bash
# Gehe zum Backend Verzeichnis
cd backend

# Installiere Dependencies
npm install

# Starte den Server
npm start
```

**Erfolgreich?** Du solltest sehen:
```
Server läuft auf Port 5000
PostgreSQL connected ✅
```

**Backend läuft auf:** `http://localhost:5000`

---

### 2️⃣ Admin-Web starten

```bash
# Öffne ein NEUES Terminal (Backend muss laufen!)
cd admin-web

# Installiere Dependencies
npm install

# Starte die React App
npm start
```

**Erfolgreich?** Browser öffnet sich automatisch:
```
http://localhost:3000
```

**Login Credentials:**
```
Email: admin@cityreport.de (oder registriert)
Passwort: 123456
```

---

### 3️⃣ Mobile-App starten

```bash
# Öffne ein DRITTES Terminal
cd mobile-app

# Installiere Dependencies
npm install

# Starte die Expo App
npm start
```

**Erfolgreich?** Du siehst einen QR-Code im Terminal:

**Optionen:**
- **Android:** Drücke `a` im Terminal
- **iOS:** Drücke `i` im Terminal (macOS erforderlich)
- **Web:** Drücke `w` im Terminal

Oder scanne den QR-Code mit **Expo Go App** (vom App Store):
```
https://expo.dev/
```

---

## 🚀 Schnellstart (alle 3 gleichzeitig)

Öffne **3 verschiedene Terminal-Fenster** nebeneinander:

**Terminal 1 - Backend:**
```bash
cd backend && npm start
```

**Terminal 2 - Admin-Web:**
```bash
cd admin-web && npm start
```

**Terminal 3 - Mobile-App:**
```bash
cd mobile-app && npm start
```

---

## 📁 Projektstruktur

```
infrastructure-reporting-system/
│
├── backend/                    # Node.js Express API
│   ├── config/                 # Datenbankverbindung
│   ├── controllers/            # Business Logic (Auth, Reports, Users)
│   ├── models/                 # Datenmodelle
│   ├── routes/                 # API Endpoints
│   ├── middleware/             # Auth, Role-Check, Upload
│   ├── uploads/                # Hochgeladene Fotos
│   ├── database.sql            # SQL Schema
│   ├── server.js               # Express Server
│   ├── package.json
│   └── .env                    # Umgebungsvariablen (nicht committen!)
│
├── admin-web/                  # React Admin Interface
│   ├── public/                 # HTML, Icons
│   ├── src/
│   │   ├── pages/              # Login, Dashboard, Reports, Users, Map
│   │   ├── services/           # API Calls
│   │   ├── css/                # Styling
│   │   └── App.js              # Main Router
│   ├── package.json
│   └── node_modules/
│
├── mobile-app/                 # React Native Expo App
│   ├── src/
│   │   ├── app/                # Screens (Login, Map, Reports)
│   │   ├── components/         # Reusable UI Components
│   │   ├── services/           # API Calls
│   │   ├── context/            # Auth Context
│   │   └── constants/          # Theme, Config
│   ├── assets/                 # Images, Icons
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                   # Diese Datei
```

---

## 🔌 API Endpoints

### Authentifizierung
```
POST   /api/auth/login         - Login mit Email/Password
POST   /api/auth/register      - Neue User registrieren
```

### Meldungen (Reports)
```
GET    /api/reports            - Alle Reports abrufen (Admin/Caseworker)
GET    /api/reports/my         - Eigene Reports (Citizen)
POST   /api/reports            - Neue Meldung erstellen (mit Foto)
PUT    /api/reports/:id/status - Status ändern (Admin/Caseworker)
PUT    /api/reports/:id/priority - Priorität ändern (Admin/Caseworker)
```

### Benutzerverwaltung
```
GET    /api/users              - Alle User auflisten (Admin)
PUT    /api/users/:id/block    - User blockieren (Admin)
DELETE /api/users/:id          - User löschen (Admin)
```

---

## 👥 Benutzerrollen & Berechtigungen

| Rolle | Permissionen |
|-------|-------------|
| **Citizen** | Erstellt Reports, sieht nur eigene Meldungen |
| **Caseworker** | Sieht alle Reports, ändert Status & Priorität |
| **Admin** | Vollständige Kontrolle (User, Reports, System) |

---

## 🗄️ Datenbank Setup

### PostgreSQL lokal einrichten (optional)

```bash
# PostgreSQL starten
sudo service postgresql start  # Linux
brew services start postgresql # macOS

# Datenbank erstellen
createdb infrastructure_db

# SQL Schema laden
psql infrastructure_db < backend/database.sql
```

### Cloud Datenbank (empfohlen)

Nutze [Render.com](https://render.com/) oder [Supabase](https://supabase.com/):
1. Kostenlose PostgreSQL Instanz erstellen
2. Connection String kopieren
3. In `.env` als `DATABASE_URL` einfügen

### Migrationen ausführen

Im `backend/` Ordner stehen SQL-Migrationen bereit:

```bash
npm run migrate
npm run migrate:normalize
npm run migrate:fix-fk
npm run migrate:cleanup
```

---

## 🐛 Troubleshooting

### Port 5000 ist schon belegt
```bash
# Finde Prozess der Port nutzt
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Beende Prozess und starte Backend neu
```

### "Cannot find module" Fehler
```bash
# Lösche node_modules und neu installieren
rm -rf node_modules package-lock.json
npm install
```

### Datenbank Verbindung schlägt fehl
```
✅ Prüfe DATABASE_URL in .env
✅ Prüfe ob PostgreSQL läuft
✅ Prüfe ob Passwort korrekt ist
```

### Mobile App QR-Code nicht sichtbar
```bash
# Starte Expo mit neuem Terminal
cd mobile-app
npm start
```

---

## 🚀 Deployment

### Live Website

- **Admin-Web (Vercel):** https://infrastructure-reporting-system.vercel.app

### API-Konfiguration im Frontend

- Admin-Web verwendet aktuell die API-URL direkt in `admin-web/src/services/api.js`.
- Mobile-App verwendet `EXPO_PUBLIC_API_URL` (oder Fallback auf Render-URL).

### Backend auf Render.com
1. Repository auf GitHub pushen
2. Neuen Web Service auf Render.com erstellen
3. Environment Variables setzen
4. Deploy!

### Frontend auf Vercel
```bash
cd admin-web
npm run build
# Vercel CLI nutzen oder GitHub verbinden
```

---

## 🤝 Git Befehle

```bash
# Änderungen stagen
git add .

# Commit mit Nachricht
git commit -m "Feature: XYZ added"

# Zu Remote pushen
git push

# Branch erstellen
git checkout -b feature/new-feature

# Status prüfen
git status
```

---

## 📚 Technologies

- **Backend:** Node.js, Express, PostgreSQL, JWT, bcryptjs
- **Frontend:** React, React Router, Axios, Leaflet
- **Mobile:** React Native, Expo, TypeScript
- **Tools:** npm, Git

---


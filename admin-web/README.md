# Admin Web

React-Adminoberfläche für das Projekt **Infrastructure Reporting System**.

## Lokale Entwicklung

### Voraussetzungen

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Starten

```bash
npm start
```

Die App läuft lokal unter:

- http://localhost:3000

## API-Anbindung

Aktuell ist im Projekt für das Admin-Web die produktive API hinterlegt:

- `https://cityreport-backend.onrender.com/api`

Datei:

- [src/services/api.js](src/services/api.js)

Hinweis: Für lokale Entwicklung kann dort alternativ `http://localhost:5000/api` genutzt werden.

## Verfügbare Skripte

- `npm start` – Development Server
- `npm test` – Test Runner
- `npm run build` – Production Build

## Test-Logins

- **Administrator**
	- Email: `admin@cityreport.de`
	- Passwort: `123456`

- **Sachbearbeiter (Caseworker)**
	- Email: `ekrayym@gmail.com`
	- Passwort: `123456`

## Produktion

- Admin-Web: Vercel
	- https://infrastructure-reporting-system.vercel.app
- Backend API: Render
	- https://cityreport-backend.onrender.com
- Datenbank: Neon (PostgreSQL)

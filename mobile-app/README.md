# Mobile App (Expo)

React Native App für Bürgermeldungen im Projekt **Infrastructure Reporting System**.

## Voraussetzungen

- Node.js 18+
- npm
- Expo Go App (optional auf echtem Gerät)

## Installation

```bash
npm install
```

## App starten (lokal)

```bash
npm run start
```

Danach im Expo-Terminal:

- `a` = Android Emulator / Gerät
- `i` = iOS Simulator (nur macOS)
- `w` = Web

## Verfügbare Skripte

- `npm run start` – Expo Dev Server
- `npm run android` – Start mit Android
- `npm run ios` – Start mit iOS
- `npm run web` – Start im Browser
- `npm run lint` – Linting
- `npm run reset-project` – Projekt-Reset-Skript

## API-Konfiguration

Die App nutzt standardmäßig das produktive Backend auf Render:

- `https://cityreport-backend.onrender.com/api`

Optional kannst du lokal eine `.env` Datei im Ordner `mobile-app/` anlegen:

```env
EXPO_PUBLIC_API_URL=https://cityreport-backend.onrender.com/api
```

Für lokales Backend stattdessen z. B.:

```env
EXPO_PUBLIC_API_URL=http://<deine-lokale-ip>:5000/api
```

## Test-Login

- **Sachbearbeiter (Caseworker)**
  - Email: `ekrayym@gmail.com`
  - Passwort: `123456`

## Produktion

- Frontend (Admin-Web): Vercel
- Backend API: Render
- Datenbank: Neon (PostgreSQL)

## Hinweis

Wenn sich Expo-Versionen ändern, nutze die passende versionierte Doku:

- https://docs.expo.dev/versions/v56.0.0/

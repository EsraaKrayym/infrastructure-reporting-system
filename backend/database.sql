CREATE TABLE IF NOT EXISTS users (
                                     id SERIAL PRIMARY KEY,
                                     name TEXT,
                                     email TEXT UNIQUE,
                                     password TEXT,
                                     role TEXT DEFAULT 'citizen',
                                     blocked BOOLEAN DEFAULT false,
                                     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_logs (
                                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          report_id INTEGER,
                                          changed_by INTEGER,
                                          action TEXT,
                                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
                                       id SERIAL PRIMARY KEY,
                                       title TEXT,
                                       description TEXT,
                                       category TEXT,
                                       latitude REAL,
                                       longitude REAL,
                                       status TEXT DEFAULT 'Neu',
                                       priority TEXT DEFAULT 'medium',
                                       address TEXT,
                                       photo TEXT,
                                       user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_logs (
                            id SERIAL PRIMARY KEY,
                            report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
                            changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                            action TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

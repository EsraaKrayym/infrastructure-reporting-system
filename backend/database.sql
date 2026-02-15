CREATE TABLE IF NOT EXISTS users (
                                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                                     name TEXT,
                                     email TEXT UNIQUE,
                                     password TEXT,
                                     role TEXT DEFAULT 'citizen'
);

CREATE TABLE IF NOT EXISTS reports (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       title TEXT,
                                       description TEXT,
                                       category TEXT,
                                       latitude REAL,
                                       longitude REAL,
                                       status TEXT DEFAULT 'Neu',
                                       user_id INTEGER,
                                       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                       FOREIGN KEY (user_id) REFERENCES users(id)
    );

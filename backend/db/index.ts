import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'path';

export const db = new Database(path.join(process.cwd(), 'finance.db'));

function hasColumn(tableName: string, columnName: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{name: string}>;
  return columns.some((column) => column.name === columnName);
}

function migrateLegacySchema() {
  if (!hasColumn('companies', 'status')) {
    db.exec("ALTER TABLE companies ADD COLUMN status TEXT DEFAULT 'active'");
  }

  if (!hasColumn('users', 'status')) {
    db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
  }

  db.exec("UPDATE companies SET status = 'active' WHERE status IS NULL OR TRIM(status) = ''");
  db.exec("UPDATE users SET status = 'active' WHERE status IS NULL OR TRIM(status) = ''");
}

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('SUPER_ADMIN', 'PROVIDER', 'COLLECTOR', 'CUSTOMER')) NOT NULL,
      nic TEXT,
      address TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      collector_id INTEGER,
      amount REAL NOT NULL,
      interest_rate REAL NOT NULL,
      total_repayable REAL NOT NULL,
      balance REAL NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (collector_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      collector_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      proof_url TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loan_id) REFERENCES loans(id),
      FOREIGN KEY (collector_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS loan_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      term_value INTEGER NOT NULL,
      term_unit TEXT CHECK(term_unit IN ('day', 'month')) NOT NULL DEFAULT 'month',
      interest_rate REAL NOT NULL,
      late_fee_value INTEGER NOT NULL DEFAULT 1,
      late_fee_unit TEXT CHECK(late_fee_unit IN ('day', 'year')) NOT NULL DEFAULT 'day',
      late_fee_rate REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS provider_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      loan_type_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(company_id, loan_type_id),
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (loan_type_id) REFERENCES loan_types(id)
    );
  `);

  migrateLegacySchema();
}

export function seedSuperAdmin() {
  const adminEmail = 'admin@lendflow.com';
  const existingAdmin = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
  if (existingAdmin) {
    return;
  }

  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
    'Super Admin',
    adminEmail,
    hashedPassword,
    'SUPER_ADMIN',
  );
}

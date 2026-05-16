import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "finance-secret-key-123";
const db = new Database(path.join(process.cwd(), "finance.db"));

// Initialize Database Schema
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
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
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

// Seed Super Admin if not exists
const adminEmail = "admin@lendflow.com";
const existingAdmin = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
if (!existingAdmin) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "Super Admin",
    adminEmail,
    hashedPassword,
    "SUPER_ADMIN"
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, role: user.role, company_id: user.company_id }, JWT_SECRET, { expiresIn: "24h" });
    db.prepare("INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)").run(user.id, 'LOGIN', 'User logged into system');
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, company_id: user.company_id } });
  });

  // NIC Search (Provider)
  app.get("/api/provider/customers/nic/:nic", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const customer = db.prepare(`
      SELECT u.*, 
        (SELECT COUNT(*) FROM loans l WHERE l.customer_id = u.id AND l.status = 'active') as active_loans,
        (SELECT SUM(balance) FROM loans l WHERE l.customer_id = u.id) as total_debt
      FROM users u 
      WHERE u.company_id = ? AND u.nic = ? AND u.role = 'CUSTOMER'
    `).get(req.user.company_id, req.params.nic);
    
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  });

  // Collectors Management (Provider)
  app.get("/api/provider/collectors", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const collectors = db.prepare("SELECT id, name, email, status FROM users WHERE company_id = ? AND role = 'COLLECTOR'").all(req.user.company_id);
    res.json(collectors);
  });

  app.post("/api/provider/collectors", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const { name, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      db.prepare("INSERT INTO users (company_id, name, email, password, role) VALUES (?, ?, ?, ?, 'COLLECTOR')").run(
        req.user.company_id, name, email, hashedPassword
      );
      res.json({ message: "Collector registered" });
    } catch (e) {
      res.status(400).json({ message: "Collector already exists" });
    }
  });

  // Audit Logs (Provider)
  app.get("/api/provider/audit-logs", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const logs = db.prepare(`
      SELECT a.*, u.name as user_name 
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      WHERE u.company_id = ? OR u.role = 'SUPER_ADMIN'
      ORDER BY a.created_at DESC LIMIT 100
    `).all(req.user.company_id);
    res.json(logs);
  });

  // Admin Stats (Super Admin)
  app.get("/api/admin/stats", authenticateToken, (req: any, res) => {
    if (req.user.role !== "SUPER_ADMIN") return res.sendStatus(403);
    const stats = {
      total_providers: db.prepare("SELECT COUNT(*) as count FROM companies").get(),
      total_active_loans: db.prepare("SELECT COUNT(*) as count FROM loans WHERE status = 'active'").get(),
      total_revenue: db.prepare("SELECT SUM(amount * interest_rate / 100) as total FROM loans WHERE status = 'settled'").get()
    };
    res.json(stats);
  });

  // Seed Demo Data
  app.post("/api/admin/seed", authenticateToken, (req: any, res) => {
    if (req.user.role !== "SUPER_ADMIN") return res.sendStatus(403);
    
    try {
      const transaction = db.transaction(() => {
        // Create a demo company
        const companyId = db.prepare("INSERT INTO companies (name) VALUES (?)").run("Demo Finance Ltd").lastInsertRowid;
        
        // Create a provider admin
        const providerPass = bcrypt.hashSync("provider123", 10);
        db.prepare("INSERT INTO users (company_id, name, email, password, role) VALUES (?, ?, ?, ?, 'PROVIDER')").run(
          companyId, "Demo Provider", "provider@demo.com", providerPass
        );

        // Create a collector
        const collectorPass = bcrypt.hashSync("collector123", 10);
        const collectorId = db.prepare("INSERT INTO users (company_id, name, email, password, role) VALUES (?, ?, ?, ?, 'COLLECTOR')").run(
          companyId, "Sam Collector", "sam@demo.com", collectorPass
        ).lastInsertRowid;

        // Create a customer
        const customerPass = bcrypt.hashSync("customer123", 10);
        const customerId = db.prepare("INSERT INTO users (company_id, name, email, password, role, nic, address) VALUES (?, ?, ?, ?, 'CUSTOMER', ?, ?)").run(
          companyId, "Jane Doe", "jane@demo.com", customerPass, "123456789X", "456 Demo Avenue"
        ).lastInsertRowid;

        // Create a loan
        db.prepare("INSERT INTO loans (company_id, customer_id, collector_id, amount, interest_rate, total_repayable, balance) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
          companyId, customerId, collectorId, 1000, 10, 1100, 1100
        );
      });
      transaction();
      res.json({ message: "Demo data seeded successfully" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Providers (Super Admin only)
  app.get("/api/admin/providers", authenticateToken, (req: any, res) => {
    if (req.user.role !== "SUPER_ADMIN") return res.sendStatus(403);
    const providers = db.prepare(`
      SELECT c.*, (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.role = 'CUSTOMER') as customer_count
      FROM companies c
    `).all();
    res.json(providers);
  });

  app.post("/api/admin/providers", authenticateToken, (req: any, res) => {
    if (req.user.role !== "SUPER_ADMIN") return res.sendStatus(403);
    const { name, email, password, admin_name } = req.body;
    
    const transaction = db.transaction(() => {
      const result = db.prepare("INSERT INTO companies (name) VALUES (?)").run(name);
      const companyId = result.lastInsertRowid;
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      // Corrected order: company_id, name, email, password, role
      db.prepare("INSERT INTO users (company_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)").run(
        companyId,
        admin_name || (name + " Admin"),
        email,
        hashedPassword,
        "PROVIDER"
      );
      return companyId;
    });

    try {
      const id = transaction();
      db.prepare("INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)").run(req.user.id, 'CREATE_PROVIDER', `Provisioned infrastructure for ${name}`);
      res.json({ id, message: "Provider created successfully" });
    } catch (error: any) {
      console.error("Provider creation error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Dashboard Stats (Provider)
  app.get("/api/provider/stats", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const companyId = req.user.company_id;
    
    const stats = {
      active_loans: db.prepare("SELECT COUNT(*) as count FROM loans WHERE company_id = ? AND status = 'active'").get(companyId),
      total_customers: db.prepare("SELECT COUNT(*) as count FROM users WHERE company_id = ? AND role = 'CUSTOMER'").get(companyId),
      total_collectors: db.prepare("SELECT COUNT(*) as count FROM users WHERE company_id = ? AND role = 'COLLECTOR'").get(companyId),
      pending_collections: db.prepare("SELECT COUNT(*) as count FROM payments p JOIN loans l ON p.loan_id = l.id WHERE l.company_id = ? AND p.status = 'pending'").get(companyId),
      total_balance: db.prepare("SELECT SUM(balance) as total FROM loans WHERE company_id = ?").get(companyId)
    };
    res.json(stats);
  });

  // Customers
  app.get("/api/provider/customers", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER" && req.user.role !== "COLLECTOR") return res.sendStatus(403);
    const customers = db.prepare("SELECT id, name, email, nic, address, status FROM users WHERE company_id = ? AND role = 'CUSTOMER'").all(req.user.company_id);
    res.json(customers);
  });

  app.get("/api/provider/loans/customer/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const loans = db.prepare("SELECT * FROM loans WHERE customer_id = ? AND company_id = ?").all(req.params.id, req.user.company_id);
    res.json(loans);
  });

  app.post("/api/provider/customers", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const { name, email, password, nic, address } = req.body;
    const hashedPassword = bcrypt.hashSync(password || "customer123", 10);
    try {
      db.prepare("INSERT INTO users (company_id, name, email, password, role, nic, address) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        req.user.company_id, name, email, hashedPassword, "CUSTOMER", nic, address
      );
      res.json({ message: "Customer registered successfully" });
    } catch (e) {
      res.status(400).json({ message: "User already exists or invalid data" });
    }
  });

  // Loans
  app.post("/api/provider/loans", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const { customer_id, amount, interest_rate, collector_id } = req.body;
    const total_repayable = amount * (1 + interest_rate / 100);
    db.prepare("INSERT INTO loans (company_id, customer_id, collector_id, amount, interest_rate, total_repayable, balance) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      req.user.company_id, customer_id, collector_id, amount, interest_rate, total_repayable, total_repayable
    );
    res.json({ message: "Loan created successfully" });
  });

  // Collections (Collector)
  app.get("/api/collector/collections", authenticateToken, (req: any, res) => {
    if (req.user.role !== "COLLECTOR") return res.sendStatus(403);
    const collections = db.prepare(`
      SELECT l.id as loan_id, u.name as customer_name, l.balance, l.total_repayable
      FROM loans l
      JOIN users u ON l.customer_id = u.id
      WHERE l.collector_id = ? AND l.status = 'active'
    `).all(req.user.id);
    res.json(collections);
  });

  app.get("/api/collector/history", authenticateToken, (req: any, res) => {
    if (req.user.role !== "COLLECTOR") return res.sendStatus(403);
    const history = db.prepare(`
      SELECT p.*, u.name as customer_name
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN users u ON l.customer_id = u.id
      WHERE p.collector_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);
    res.json(history);
  });

  app.post("/api/collector/payments", authenticateToken, (req: any, res) => {
    if (req.user.role !== "COLLECTOR") return res.sendStatus(403);
    const { loan_id, amount, proof_url } = req.body;
    db.prepare("INSERT INTO payments (loan_id, collector_id, amount, proof_url) VALUES (?, ?, ?, ?)").run(
      loan_id, req.user.id, amount, proof_url
    );
    res.json({ message: "Payment submitted for approval" });
  });

  // Customer Routes
  app.get("/api/customer/stats", authenticateToken, (req: any, res) => {
    if (req.user.role !== "CUSTOMER") return res.sendStatus(403);
    const stats = {
      active_loans: db.prepare("SELECT COUNT(*) as count FROM loans WHERE customer_id = ? AND status = 'active'").get(req.user.id),
      total_balance: db.prepare("SELECT SUM(balance) as total FROM loans WHERE customer_id = ?").get(req.user.id),
      settled_loans: db.prepare("SELECT COUNT(*) as count FROM loans WHERE customer_id = ? AND status = 'settled'").get(req.user.id)
    };
    res.json(stats);
  });

  app.get("/api/customer/loans", authenticateToken, (req: any, res) => {
    if (req.user.role !== "CUSTOMER") return res.sendStatus(403);
    const loans = db.prepare(`
      SELECT l.*, c.name as company_name 
      FROM loans l
      JOIN companies c ON l.company_id = c.id
      WHERE l.customer_id = ?
    `).all(req.user.id);
    res.json(loans);
  });

  app.get("/api/customer/payments", authenticateToken, (req: any, res) => {
    if (req.user.role !== "CUSTOMER") return res.sendStatus(403);
    const payments = db.prepare(`
      SELECT p.*, l.amount as loan_amount, l.interest_rate
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      WHERE l.customer_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);
    res.json(payments);
  });

  // Approval (Provider)
  app.get("/api/provider/pending-payments", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const payments = db.prepare(`
      SELECT p.*, u.name as collector_name, l.customer_id, cust.name as customer_name
      FROM payments p
      JOIN users u ON p.collector_id = u.id
      JOIN loans l ON p.loan_id = l.id
      JOIN users cust ON l.customer_id = cust.id
      WHERE l.company_id = ? AND p.status = 'pending'
    `).all(req.user.company_id);
    res.json(payments);
  });

  app.post("/api/provider/approve-payment", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const { payment_id, status } = req.body; // 'approved' or 'rejected'
    
    if (status === 'approved') {
      const transaction = db.transaction(() => {
        const payment: any = db.prepare("SELECT * FROM payments WHERE id = ?").get(payment_id);
        db.prepare("UPDATE payments SET status = 'approved' WHERE id = ?").run(payment_id);
        db.prepare("UPDATE loans SET balance = balance - ? WHERE id = ?").run(payment.amount, payment.loan_id);
        
        // If balance is 0, settle loan
        const loan: any = db.prepare("SELECT balance FROM loans WHERE id = ?").get(payment.loan_id);
        if (loan.balance <= 0) {
          db.prepare("UPDATE loans SET status = 'settled' WHERE id = ?").run(payment.loan_id);
        }
      });
      transaction();
    } else {
      db.prepare("UPDATE payments SET status = 'rejected' WHERE id = ?").run(payment_id);
    }
    res.json({ message: `Payment ${status}` });
  });

  app.get("/api/provider/assigned-loan-types", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const loanTypes = db.prepare(`
      SELECT lt.* FROM loan_types lt
      INNER JOIN provider_policies pp ON pp.loan_type_id = lt.id
      WHERE pp.company_id = ?
      ORDER BY lt.name
    `).all(req.user.company_id);
    res.json(loanTypes);
  });

  // --- Loan Types (Super Admin) ---
  app.get("/api/admin/loan-types", authenticateToken, (req: any, res) => {
    if (req.user.role !== "SUPER_ADMIN") return res.sendStatus(403);
    const loanTypes = db.prepare("SELECT * FROM loan_types ORDER BY created_at DESC").all();
    res.json(loanTypes);
  });

  app.post("/api/admin/loan-types", authenticateToken, (req: any, res) => {
    if (req.user.role !== "SUPER_ADMIN") return res.sendStatus(403);
    const { name, term_value, term_unit, interest_rate, late_fee_value, late_fee_unit, late_fee_rate } = req.body;
    if (!name || !term_value || !term_unit || interest_rate == null || !late_fee_value || !late_fee_unit || late_fee_rate == null) {
      return res.status(400).json({ message: "All fields are required" });
    }
    try {
      const result = db.prepare(
        "INSERT INTO loan_types (name, term_value, term_unit, interest_rate, late_fee_value, late_fee_unit, late_fee_rate) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(name, term_value, term_unit, interest_rate, late_fee_value, late_fee_unit, late_fee_rate);
      res.json({ id: result.lastInsertRowid, message: "Loan type created" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // --- Provider Policies ---
  app.get("/api/provider/loan-types", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const loanTypes = db.prepare("SELECT * FROM loan_types ORDER BY created_at DESC").all();
    res.json(loanTypes);
  });

  app.get("/api/provider/policies", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const policies = db.prepare("SELECT * FROM provider_policies WHERE company_id = ?").all(req.user.company_id);
    res.json(policies);
  });

  app.post("/api/provider/policies", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const { loan_type_id } = req.body;
    if (!loan_type_id) return res.status(400).json({ message: "loan_type_id is required" });
    try {
      db.prepare("INSERT INTO provider_policies (company_id, loan_type_id) VALUES (?, ?)").run(req.user.company_id, loan_type_id);
      res.json({ message: "Policy assigned" });
    } catch (e: any) {
      res.status(400).json({ message: "Policy already assigned" });
    }
  });

  app.post("/api/provider/policies/remove", authenticateToken, (req: any, res) => {
    if (req.user.role !== "PROVIDER") return res.sendStatus(403);
    const { loan_type_id } = req.body;
    if (!loan_type_id) return res.status(400).json({ message: "loan_type_id is required" });
    db.prepare("DELETE FROM provider_policies WHERE company_id = ? AND loan_type_id = ?").run(req.user.company_id, loan_type_id);
    res.json({ message: "Policy removed" });
  });

  // --- Super Admin: Manage Provider Policies ---
  app.get("/api/admin/provider-policies/:provider_id", authenticateToken, (req: any, res) => {
    if (req.user.role !== "SUPER_ADMIN") return res.sendStatus(403);
    const { provider_id } = req.params;
    const policies = db.prepare("SELECT * FROM provider_policies WHERE company_id = ? ORDER BY created_at DESC").all(provider_id);
    res.json(policies);
  });

  app.post("/api/admin/provider-policies/assign", authenticateToken, (req: any, res) => {
    if (req.user.role !== "SUPER_ADMIN") return res.sendStatus(403);
    const { provider_id, loan_type_id } = req.body;
    if (!provider_id || !loan_type_id) return res.status(400).json({ message: "provider_id and loan_type_id are required" });
    try {
      db.prepare("INSERT INTO provider_policies (company_id, loan_type_id) VALUES (?, ?)").run(provider_id, loan_type_id);
      res.json({ message: "Policy assigned" });
    } catch (e: any) {
      res.status(400).json({ message: "Policy already assigned or invalid IDs" });
    }
  });

  app.post("/api/admin/provider-policies/remove", authenticateToken, (req: any, res) => {
    if (req.user.role !== "SUPER_ADMIN") return res.sendStatus(403);
    const { provider_id, loan_type_id } = req.body;
    if (!provider_id || !loan_type_id) return res.status(400).json({ message: "provider_id and loan_type_id are required" });
    db.prepare("DELETE FROM provider_policies WHERE company_id = ? AND loan_type_id = ?").run(provider_id, loan_type_id);
    res.json({ message: "Policy removed" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

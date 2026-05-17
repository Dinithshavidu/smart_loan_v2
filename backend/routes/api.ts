import bcrypt from 'bcryptjs';
import {Express} from 'express';
import jwt from 'jsonwebtoken';

import {AuthenticatedRequest, authenticateToken, requireRole} from '../middleware/auth';

type ApiDeps = {
  db: any;
  jwtSecret: string;
};

export function registerApiRoutes(app: Express, {db, jwtSecret}: ApiDeps) {
  const auth = authenticateToken(jwtSecret, db);

  app.post('/api/auth/login', (req, res) => {
    const {email, password} = req.body;
    const user: any = db
      .prepare(
        `
          SELECT u.*, c.status as company_status
          FROM users u
          LEFT JOIN companies c ON c.id = u.company_id
          WHERE u.email = ?
        `,
      )
      .get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({message: 'Invalid credentials'});
    }

    if (user.status !== 'active') {
      return res.status(403).json({message: 'User account is deactivated'});
    }

    if (user.role !== 'SUPER_ADMIN' && user.company_status !== 'active') {
      return res.status(403).json({message: 'Company is deactivated'});
    }

    const token = jwt.sign({id: user.id, role: user.role, company_id: user.company_id}, jwtSecret, {
      expiresIn: '24h',
    });
    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)').run(
      user.id,
      'LOGIN',
      'User logged into system',
    );

    res.json({
      token,
      user: {id: user.id, name: user.name, email: user.email, role: user.role, company_id: user.company_id},
    });
  });

  app.get('/api/provider/customers/nic-suggest', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) return res.json([]);
    const pattern = `%${q}%`;
    const suggestions = db
      .prepare(`SELECT id, name, nic FROM users WHERE company_id = ? AND role = 'CUSTOMER' AND status = 'active' AND (nic LIKE ? OR name LIKE ?) LIMIT 10`)
      .all(req.user?.company_id, pattern, pattern) as {id: number; name: string; nic: string}[];
    res.json(suggestions);
  });

  app.get('/api/provider/customers/nic/:nic', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const customer = db
      .prepare(`
      SELECT u.*, 
        (SELECT COUNT(*) FROM loans l WHERE l.customer_id = u.id AND l.status = 'active') as active_loans,
        (SELECT SUM(balance) FROM loans l WHERE l.customer_id = u.id) as total_debt
      FROM users u 
      WHERE u.company_id = ? AND u.nic = ? AND u.role = 'CUSTOMER'
    `)
      .get(req.user?.company_id, req.params.nic);

    if (!customer) {
      return res.status(404).json({message: 'Customer not found'});
    }
    res.json(customer);
  });

  app.get('/api/admin/customers/nic/:nic', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const customer = db
      .prepare(
        `
          SELECT
            u.id,
            u.company_id,
            c.name as company_name,
            c.status as company_status,
            u.name,
            u.email,
            u.nic,
            u.address,
            u.status,
            (SELECT COUNT(*) FROM loans l WHERE l.customer_id = u.id AND l.status = 'active') as active_loans,
            (SELECT COALESCE(SUM(balance), 0) FROM loans l WHERE l.customer_id = u.id) as total_debt
          FROM users u
          LEFT JOIN companies c ON c.id = u.company_id
          WHERE u.nic = ? AND u.role = 'CUSTOMER'
          LIMIT 1
        `,
      )
      .get(req.params.nic);

    if (!customer) {
      return res.status(404).json({message: 'Customer not found'});
    }

    res.json(customer);
  });

  app.get('/api/provider/collectors', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const collectors = db
      .prepare("SELECT id, name, email, status FROM users WHERE company_id = ? AND role = 'COLLECTOR' AND status = 'active'")
      .all(req.user?.company_id);
    res.json(collectors);
  });

  app.post('/api/provider/collectors', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const {name, email, password} = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      db.prepare("INSERT INTO users (company_id, name, email, password, role) VALUES (?, ?, ?, ?, 'COLLECTOR')").run(
        req.user?.company_id,
        name,
        email,
        hashedPassword,
      );
      res.json({message: 'Collector registered'});
    } catch {
      res.status(400).json({message: 'Collector already exists'});
    }
  });

  app.get('/api/provider/audit-logs', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const logs = db
      .prepare(`
      SELECT a.*, u.name as user_name 
      FROM audit_logs a
      JOIN users u ON a.user_id = u.id
      WHERE u.company_id = ? OR u.role = 'SUPER_ADMIN'
      ORDER BY a.created_at DESC LIMIT 100
    `)
      .all(req.user?.company_id);
    res.json(logs);
  });

  app.get('/api/admin/stats', auth, requireRole('SUPER_ADMIN'), (_req, res) => {
    const stats = {
      total_providers: db.prepare('SELECT COUNT(*) as count FROM companies').get(),
      total_active_loans: db.prepare("SELECT COUNT(*) as count FROM loans WHERE status = 'active'").get(),
      total_revenue: db.prepare("SELECT SUM(amount * interest_rate / 100) as total FROM loans WHERE status = 'settled'").get(),
    };
    res.json(stats);
  });

  app.post('/api/admin/seed', auth, requireRole('SUPER_ADMIN'), (_req, res) => {
    try {
      const transaction = db.transaction(() => {
        const companyId = db.prepare('INSERT INTO companies (name) VALUES (?)').run('Demo Finance Ltd').lastInsertRowid;

        const providerPass = bcrypt.hashSync('provider123', 10);
        db.prepare("INSERT INTO users (company_id, name, email, password, role) VALUES (?, ?, ?, ?, 'PROVIDER')").run(
          companyId,
          'Demo Provider',
          'provider@demo.com',
          providerPass,
        );

        const collectorPass = bcrypt.hashSync('collector123', 10);
        const collectorId = db
          .prepare("INSERT INTO users (company_id, name, email, password, role) VALUES (?, ?, ?, ?, 'COLLECTOR')")
          .run(companyId, 'Sam Collector', 'sam@demo.com', collectorPass).lastInsertRowid;

        const customerPass = bcrypt.hashSync('customer123', 10);
        const customerId = db
          .prepare(
            "INSERT INTO users (company_id, name, email, password, role, nic, address) VALUES (?, ?, ?, ?, 'CUSTOMER', ?, ?)",
          )
          .run(companyId, 'Jane Doe', 'jane@demo.com', customerPass, '123456789X', '456 Demo Avenue').lastInsertRowid;

        db.prepare(
          'INSERT INTO loans (company_id, customer_id, collector_id, amount, interest_rate, total_repayable, balance) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ).run(companyId, customerId, collectorId, 1000, 10, 1100, 1100);
      });

      transaction();
      res.json({message: 'Demo data seeded successfully'});
    } catch (e: any) {
      res.status(500).json({message: e.message});
    }
  });

  app.get('/api/admin/providers', auth, requireRole('SUPER_ADMIN'), (_req, res) => {
    const providers = db
      .prepare(`
      SELECT
        c.*,
        (
          SELECT u.id FROM users u
          WHERE u.company_id = c.id AND u.role = 'PROVIDER'
          ORDER BY u.created_at ASC LIMIT 1
        ) as provider_id,
        (
          SELECT u.name FROM users u
          WHERE u.company_id = c.id AND u.role = 'PROVIDER'
          ORDER BY u.created_at ASC LIMIT 1
        ) as provider_name,
        (
          SELECT u.email FROM users u
          WHERE u.company_id = c.id AND u.role = 'PROVIDER'
          ORDER BY u.created_at ASC LIMIT 1
        ) as provider_email,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.role = 'PROVIDER') as provider_count,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.role = 'COLLECTOR') as collector_count,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.role = 'CUSTOMER') as customer_count,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) as total_user_count
      FROM companies c
      ORDER BY c.created_at DESC
    `)
      .all();
    res.json(providers);
  });

  app.get('/api/admin/companies', auth, requireRole('SUPER_ADMIN'), (_req, res) => {
    const companies = db
      .prepare(`
      SELECT
        c.*,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.role = 'PROVIDER') as provider_count,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.role = 'COLLECTOR') as collector_count,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id AND u.role = 'CUSTOMER') as customer_count,
        (SELECT COUNT(*) FROM users u WHERE u.company_id = c.id) as total_user_count
      FROM companies c
      ORDER BY c.created_at DESC
    `)
      .all();

    res.json(companies);
  });

  app.post('/api/admin/companies', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const rawName = req.body?.name;
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    if (!name) {
      return res.status(400).json({message: 'Company name is required'});
    }

    try {
      const existing = db
        .prepare('SELECT id, name, status FROM companies WHERE LOWER(name) = LOWER(?) LIMIT 1')
        .get(name);

      if (existing) {
        return res.json({
          id: existing.id,
          existing: true,
          message: `Company already exists (${existing.status})`,
        });
      }

      const result = db.prepare("INSERT INTO companies (name, status) VALUES (?, 'active')").run(name);
      res.json({id: result.lastInsertRowid, message: 'Company created successfully'});
    } catch (error: any) {
      res.status(400).json({message: error.message});
    }
  });

  app.post('/api/admin/companies/:id/deactivate', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const companyId = Number(req.params.id);
    if (Number.isNaN(companyId)) {
      return res.status(400).json({message: 'Invalid company id'});
    }

    const company = db.prepare('SELECT id, status FROM companies WHERE id = ?').get(companyId);
    if (!company) {
      return res.status(404).json({message: 'Company not found'});
    }

    const transaction = db.transaction(() => {
      db.prepare("UPDATE companies SET status = 'inactive' WHERE id = ?").run(companyId);
      db.prepare("UPDATE users SET status = 'inactive' WHERE company_id = ?").run(companyId);
    });

    transaction();
    res.json({message: 'Company and all related users deactivated'});
  });

  app.post('/api/admin/companies/:id/activate', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const companyId = Number(req.params.id);
    if (Number.isNaN(companyId)) {
      return res.status(400).json({message: 'Invalid company id'});
    }

    const company = db.prepare('SELECT id FROM companies WHERE id = ?').get(companyId);
    if (!company) {
      return res.status(404).json({message: 'Company not found'});
    }

    const transaction = db.transaction(() => {
      db.prepare("UPDATE companies SET status = 'active' WHERE id = ?").run(companyId);
      db.prepare("UPDATE users SET status = 'active' WHERE company_id = ?").run(companyId);
    });

    transaction();
    res.json({message: 'Company and related users activated'});
  });

  app.post('/api/admin/providers/allocate', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const {provider_id, company_id} = req.body;
    if (!provider_id || !company_id) {
      return res.status(400).json({message: 'provider_id and company_id are required'});
    }

    const provider = db
      .prepare("SELECT id, role FROM users WHERE id = ? AND role = 'PROVIDER'")
      .get(provider_id);
    if (!provider) {
      return res.status(404).json({message: 'Provider not found'});
    }

    const company: any = db.prepare('SELECT id, status FROM companies WHERE id = ?').get(company_id);
    if (!company) {
      return res.status(404).json({message: 'Company not found'});
    }

    const nextStatus = company.status === 'active' ? 'active' : 'inactive';
    db.prepare('UPDATE users SET company_id = ?, status = ? WHERE id = ?').run(company_id, nextStatus, provider_id);
    res.json({message: 'Provider allocated to company successfully'});
  });

  app.get('/api/admin/companies/:id/users', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const companyId = Number(req.params.id);
    const {role} = req.query;

    if (Number.isNaN(companyId)) {
      return res.status(400).json({message: 'Invalid company id'});
    }

    if (role) {
      const users = db
        .prepare(
          `
            SELECT id, company_id, name, email, role, status, nic, address, created_at
            FROM users
            WHERE company_id = ? AND role = ?
            ORDER BY created_at DESC
          `,
        )
        .all(companyId, role);
      return res.json(users);
    }

    const users = db
      .prepare(
        `
          SELECT id, company_id, name, email, role, status, nic, address, created_at
          FROM users
          WHERE company_id = ?
          ORDER BY role, created_at DESC
        `,
      )
      .all(companyId);

    res.json(users);
  });

  app.get('/api/admin/companies/:id/providers', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const companyId = Number(req.params.id);
    if (Number.isNaN(companyId)) {
      return res.status(400).json({message: 'Invalid company id'});
    }

    const providers = db
      .prepare(
        `
          SELECT id, company_id, name, email, role, status, created_at
          FROM users
          WHERE company_id = ? AND role = 'PROVIDER'
          ORDER BY created_at DESC
        `,
      )
      .all(companyId);

    res.json(providers);
  });

  app.get('/api/admin/companies/:id/collectors', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const companyId = Number(req.params.id);
    if (Number.isNaN(companyId)) {
      return res.status(400).json({message: 'Invalid company id'});
    }

    const collectors = db
      .prepare(
        `
          SELECT id, company_id, name, email, role, status, created_at
          FROM users
          WHERE company_id = ? AND role = 'COLLECTOR'
          ORDER BY created_at DESC
        `,
      )
      .all(companyId);

    res.json(collectors);
  });

  app.get('/api/admin/users/providers', auth, requireRole('SUPER_ADMIN'), (_req, res) => {
    const providers = db
      .prepare(
        `
          SELECT u.id, u.company_id, u.name, u.email, u.role, u.status, u.created_at, c.name as company_name
          FROM users u
          LEFT JOIN companies c ON c.id = u.company_id
          WHERE u.role = 'PROVIDER'
          ORDER BY u.created_at DESC
        `,
      )
      .all();

    res.json(providers);
  });

  app.post('/api/admin/users/:id/reset-password', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const userId = Number(req.params.id);
    const {new_password} = req.body;

    if (Number.isNaN(userId)) {
      return res.status(400).json({message: 'Invalid user id'});
    }

    if (!new_password || String(new_password).length < 6) {
      return res.status(400).json({message: 'new_password is required and must be at least 6 characters'});
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }

    const hashedPassword = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);

    res.json({message: 'Password reset successfully'});
  });

  app.post('/api/admin/providers', auth, requireRole('SUPER_ADMIN'), (req: AuthenticatedRequest, res) => {
    const {company_id, admin_name, email, password} = req.body;

    const companyId = Number(company_id);
    if (!companyId || isNaN(companyId)) {
      return res.status(400).json({message: 'Company is required'});
    }
    if (!email || !password) {
      return res.status(400).json({message: 'Email and password are required'});
    }

    const company = db.prepare('SELECT id, name FROM companies WHERE id = ?').get(companyId) as {id: number; name: string} | undefined;
    if (!company) {
      return res.status(404).json({message: 'Company not found'});
    }

    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const providerName = typeof admin_name === 'string' && admin_name.trim() ? admin_name.trim() : `${company.name} Admin`;
      db.prepare("INSERT INTO users (company_id, name, email, password, role, status) VALUES (?, ?, ?, ?, 'PROVIDER', 'active')")
        .run(companyId, providerName, email, hashedPassword);
      db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)').run(
        req.user?.id,
        'CREATE_PROVIDER',
        `Registered provider for company: ${company.name}`,
      );
      res.json({message: 'Provider registered successfully'});
    } catch (error: any) {
      console.error('Provider creation error:', error);
      res.status(400).json({message: error.message});
    }
  });

  app.get('/api/provider/stats', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const companyId = req.user?.company_id;

    const stats = {
      active_loans: db.prepare("SELECT COUNT(*) as count FROM loans WHERE company_id = ? AND status = 'active'").get(companyId),
      total_customers: db.prepare("SELECT COUNT(*) as count FROM users WHERE company_id = ? AND role = 'CUSTOMER'").get(companyId),
      total_collectors: db.prepare("SELECT COUNT(*) as count FROM users WHERE company_id = ? AND role = 'COLLECTOR'").get(companyId),
      pending_collections: db
        .prepare("SELECT COUNT(*) as count FROM payments p JOIN loans l ON p.loan_id = l.id WHERE l.company_id = ? AND p.status = 'pending'")
        .get(companyId),
      total_balance: db.prepare('SELECT SUM(balance) as total FROM loans WHERE company_id = ?').get(companyId),
    };
    res.json(stats);
  });

  app.get('/api/provider/customers', auth, requireRole('PROVIDER', 'COLLECTOR'), (req: AuthenticatedRequest, res) => {
    const customers = db
      .prepare("SELECT id, name, email, nic, address, status FROM users WHERE company_id = ? AND role = 'CUSTOMER'")
      .all(req.user?.company_id);
    res.json(customers);
  });

  app.get('/api/provider/loans/customer/:id', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const loans = db.prepare('SELECT * FROM loans WHERE customer_id = ? AND company_id = ?').all(req.params.id, req.user?.company_id);
    res.json(loans);
  });

  app.post('/api/provider/customers', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const {name, email, password, nic, address} = req.body;
    if (!name || !name.toString().trim()) {
      return res.status(400).json({message: 'Customer name is required'});
    }
    const resolvedEmail =
      email && email.toString().trim()
        ? email.toString().trim()
        : `cust_${Date.now()}_${Math.random().toString(36).slice(2)}@noreply.local`;
    const hashedPassword = bcrypt.hashSync(password || 'customer123', 10);
    try {
      db.prepare('INSERT INTO users (company_id, name, email, password, role, nic, address) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        req.user?.company_id,
        name.toString().trim(),
        resolvedEmail,
        hashedPassword,
        'CUSTOMER',
        nic || null,
        address || null,
      );
      res.json({message: 'Customer registered successfully'});
    } catch (err: any) {
      if (err?.message?.includes('UNIQUE')) {
        res.status(400).json({message: 'A customer with this email already exists'});
      } else {
        res.status(400).json({message: err?.message || 'Failed to register customer'});
      }
    }
  });

  app.post('/api/provider/loans', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const {customer_id, amount, interest_rate, collector_id} = req.body;
    const total_repayable = amount * (1 + interest_rate / 100);
    db.prepare(
      'INSERT INTO loans (company_id, customer_id, collector_id, amount, interest_rate, total_repayable, balance) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(req.user?.company_id, customer_id, collector_id, amount, interest_rate, total_repayable, total_repayable);
    res.json({message: 'Loan created successfully'});
  });

  app.get('/api/collector/collections', auth, requireRole('COLLECTOR'), (req: AuthenticatedRequest, res) => {
    const collections = db
      .prepare(`
      SELECT l.id as loan_id, u.name as customer_name, l.balance, l.total_repayable
      FROM loans l
      JOIN users u ON l.customer_id = u.id
      WHERE l.collector_id = ? AND l.status = 'active'
    `)
      .all(req.user?.id);
    res.json(collections);
  });

  app.get('/api/collector/history', auth, requireRole('COLLECTOR'), (req: AuthenticatedRequest, res) => {
    const history = db
      .prepare(`
      SELECT p.*, u.name as customer_name
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN users u ON l.customer_id = u.id
      WHERE p.collector_id = ?
      ORDER BY p.created_at DESC
    `)
      .all(req.user?.id);
    res.json(history);
  });

  app.post('/api/collector/payments', auth, requireRole('COLLECTOR'), (req: AuthenticatedRequest, res) => {
    const {loan_id, amount, proof_url} = req.body;
    db.prepare('INSERT INTO payments (loan_id, collector_id, amount, proof_url) VALUES (?, ?, ?, ?)').run(
      loan_id,
      req.user?.id,
      amount,
      proof_url,
    );
    res.json({message: 'Payment submitted for approval'});
  });

  app.get('/api/customer/stats', auth, requireRole('CUSTOMER'), (req: AuthenticatedRequest, res) => {
    const stats = {
      active_loans: db.prepare("SELECT COUNT(*) as count FROM loans WHERE customer_id = ? AND status = 'active'").get(req.user?.id),
      total_balance: db.prepare('SELECT SUM(balance) as total FROM loans WHERE customer_id = ?').get(req.user?.id),
      settled_loans: db
        .prepare("SELECT COUNT(*) as count FROM loans WHERE customer_id = ? AND status = 'settled'")
        .get(req.user?.id),
    };
    res.json(stats);
  });

  app.get('/api/customer/loans', auth, requireRole('CUSTOMER'), (req: AuthenticatedRequest, res) => {
    const loans = db
      .prepare(`
      SELECT l.*, c.name as company_name 
      FROM loans l
      JOIN companies c ON l.company_id = c.id
      WHERE l.customer_id = ?
    `)
      .all(req.user?.id);
    res.json(loans);
  });

  app.get('/api/customer/payments', auth, requireRole('CUSTOMER'), (req: AuthenticatedRequest, res) => {
    const payments = db
      .prepare(`
      SELECT p.*, l.amount as loan_amount, l.interest_rate
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      WHERE l.customer_id = ?
      ORDER BY p.created_at DESC
    `)
      .all(req.user?.id);
    res.json(payments);
  });

  app.get('/api/provider/pending-payments', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const payments = db
      .prepare(`
      SELECT p.*, u.name as collector_name, l.customer_id, cust.name as customer_name
      FROM payments p
      JOIN users u ON p.collector_id = u.id
      JOIN loans l ON p.loan_id = l.id
      JOIN users cust ON l.customer_id = cust.id
      WHERE l.company_id = ? AND p.status = 'pending'
    `)
      .all(req.user?.company_id);
    res.json(payments);
  });

  app.post('/api/provider/approve-payment', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const {payment_id, status} = req.body;

    if (status === 'approved') {
      const transaction = db.transaction(() => {
        const payment: any = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id);
        db.prepare("UPDATE payments SET status = 'approved' WHERE id = ?").run(payment_id);
        db.prepare('UPDATE loans SET balance = balance - ? WHERE id = ?').run(payment.amount, payment.loan_id);

        const loan: any = db.prepare('SELECT balance FROM loans WHERE id = ?').get(payment.loan_id);
        if (loan.balance <= 0) {
          db.prepare("UPDATE loans SET status = 'settled' WHERE id = ?").run(payment.loan_id);
        }
      });
      transaction();
    } else {
      db.prepare("UPDATE payments SET status = 'rejected' WHERE id = ?").run(payment_id);
    }

    res.json({message: `Payment ${status}`});
  });

  app.get('/api/provider/assigned-loan-types', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const loanTypes = db
      .prepare(`
      SELECT lt.* FROM loan_types lt
      INNER JOIN provider_policies pp ON pp.loan_type_id = lt.id
      WHERE pp.company_id = ?
      ORDER BY lt.name
    `)
      .all(req.user?.company_id);
    res.json(loanTypes);
  });

  app.get('/api/admin/loan-types', auth, requireRole('SUPER_ADMIN'), (_req, res) => {
    const loanTypes = db.prepare('SELECT * FROM loan_types ORDER BY created_at DESC').all();
    res.json(loanTypes);
  });

  app.post('/api/admin/loan-types', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const {name, term_value, term_unit, interest_rate, late_fee_value, late_fee_unit, late_fee_rate} = req.body;
    if (!name || !term_value || !term_unit || interest_rate == null || !late_fee_value || !late_fee_unit || late_fee_rate == null) {
      return res.status(400).json({message: 'All fields are required'});
    }

    try {
      const result = db
        .prepare(
          'INSERT INTO loan_types (name, term_value, term_unit, interest_rate, late_fee_value, late_fee_unit, late_fee_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .run(name, term_value, term_unit, interest_rate, late_fee_value, late_fee_unit, late_fee_rate);
      res.json({id: result.lastInsertRowid, message: 'Loan type created'});
    } catch (e: any) {
      res.status(400).json({message: e.message});
    }
  });

  app.get('/api/provider/loan-types', auth, requireRole('PROVIDER'), (_req, res) => {
    const loanTypes = db.prepare('SELECT * FROM loan_types ORDER BY created_at DESC').all();
    res.json(loanTypes);
  });

  app.get('/api/provider/policies', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const policies = db.prepare('SELECT * FROM provider_policies WHERE company_id = ?').all(req.user?.company_id);
    res.json(policies);
  });

  app.post('/api/provider/policies', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const {loan_type_id} = req.body;
    if (!loan_type_id) {
      return res.status(400).json({message: 'loan_type_id is required'});
    }

    try {
      db.prepare('INSERT INTO provider_policies (company_id, loan_type_id) VALUES (?, ?)').run(req.user?.company_id, loan_type_id);
      res.json({message: 'Policy assigned'});
    } catch {
      res.status(400).json({message: 'Policy already assigned'});
    }
  });

  app.post('/api/provider/policies/remove', auth, requireRole('PROVIDER'), (req: AuthenticatedRequest, res) => {
    const {loan_type_id} = req.body;
    if (!loan_type_id) {
      return res.status(400).json({message: 'loan_type_id is required'});
    }

    db.prepare('DELETE FROM provider_policies WHERE company_id = ? AND loan_type_id = ?').run(req.user?.company_id, loan_type_id);
    res.json({message: 'Policy removed'});
  });

  app.get('/api/admin/provider-policies/:provider_id', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const {provider_id} = req.params;
    const policies = db.prepare('SELECT * FROM provider_policies WHERE company_id = ? ORDER BY created_at DESC').all(provider_id);
    res.json(policies);
  });

  app.post('/api/admin/provider-policies/assign', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const {provider_id, loan_type_id} = req.body;
    if (!provider_id || !loan_type_id) {
      return res.status(400).json({message: 'provider_id and loan_type_id are required'});
    }

    try {
      db.prepare('INSERT INTO provider_policies (company_id, loan_type_id) VALUES (?, ?)').run(provider_id, loan_type_id);
      res.json({message: 'Policy assigned'});
    } catch {
      res.status(400).json({message: 'Policy already assigned or invalid IDs'});
    }
  });

  app.post('/api/admin/provider-policies/remove', auth, requireRole('SUPER_ADMIN'), (req, res) => {
    const {provider_id, loan_type_id} = req.body;
    if (!provider_id || !loan_type_id) {
      return res.status(400).json({message: 'provider_id and loan_type_id are required'});
    }

    db.prepare('DELETE FROM provider_policies WHERE company_id = ? AND loan_type_id = ?').run(provider_id, loan_type_id);
    res.json({message: 'Policy removed'});
  });
}

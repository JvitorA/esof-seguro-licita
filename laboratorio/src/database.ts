import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { AuditEvent, LabMode, Proposal, Session, Tender, User } from './types.js';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}

function passwordMatches(password: unknown, encoded: unknown): number {
  if (typeof password !== 'string' || typeof encoded !== 'string') return 0;
  const [salt, digest] = encoded.split(':');
  if (!salt || !digest || !/^[a-f0-9]{64}$/.test(digest)) return 0;
  return Number(timingSafeEqual(scryptSync(password, salt, 32), Buffer.from(digest, 'hex')));
}

export const SESSION_TTL_SECONDS = 15 * 60;
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

export class Store {
  private db: DatabaseSync;

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    // A função mantém o armazenamento com hash nos dois ambientes. O defeito
    // demonstrado no login vulnerável é a concatenação de SQL, não a senha em texto.
    this.db.function('password_matches', passwordMatches);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL, role TEXT NOT NULL, company TEXT
      );
      CREATE TABLE IF NOT EXISTS tenders (
        id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
        description TEXT NOT NULL, category TEXT NOT NULL,
        estimate INTEGER NOT NULL, deadline INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS proposals (
        id INTEGER PRIMARY KEY, tender_id INTEGER NOT NULL REFERENCES tenders(id),
        user_id INTEGER NOT NULL REFERENCES users(id), company TEXT NOT NULL,
        value_cents INTEGER NOT NULL CHECK(value_cents > 0), notes TEXT NOT NULL,
        updated_at INTEGER NOT NULL, UNIQUE(tender_id, company)
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
        csrf TEXT NOT NULL, expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS audit (
        id INTEGER PRIMARY KEY, created_at INTEGER NOT NULL, actor TEXT NOT NULL,
        action TEXT NOT NULL, target TEXT NOT NULL, result TEXT NOT NULL
      );
    `);
    const count = this.db.prepare('SELECT COUNT(*) AS total FROM users').get()!;
    if (count.total === 0) this.seed();
  }

  private seed() {
    const now = Date.now();
    const day = 86_400_000;
    this.db.exec('BEGIN');
    try {
      const insertUser = this.db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)');
      const users = [
        [1, 'Ana Martins', 'ana@alfa.test', 'Alfa@123456', 'fornecedor', 'Alfa Tecnologia'],
        [2, 'Bruno Costa', 'bruno@beta.test', 'Beta@123456', 'fornecedor', 'Beta Soluções'],
        [3, 'Carla Mendes', 'carla@comissao.test', 'Comissao@123456', 'comissao', null],
        [4, 'Sérgio Oliveira', 'sergio@licita.test', 'Servidor@123456', 'servidor', null],
        [5, 'Administrador', 'admin@licita.test', 'Admin@123456', 'admin', null],
      ] as const;
      for (const [id, name, email, password, role, company] of users) {
        insertUser.run(id, name, email, hashPassword(password), role, company);
      }
      const insertTender = this.db.prepare('INSERT INTO tenders VALUES (?, ?, ?, ?, ?, ?, ?)');
      insertTender.run(1, 'PE 042/2026', 'Aquisição de equipamentos de informática', 'Fornecimento de 25 notebooks e acessórios para modernização dos laboratórios de ensino. Entrega no campus, com garantia de 36 meses.', 'Tecnologia', 18_450_000, now + 14 * day);
      insertTender.run(2, 'PE 038/2026', 'Mobiliário para espaços de aprendizagem', 'Aquisição de mesas e cadeiras para as salas de estudo. O recebimento foi encerrado e as propostas estão disponíveis à comissão.', 'Mobiliário', 6_200_000, now - 2 * day);
      insertTender.run(3, 'PE 047/2026', 'Manutenção preventiva de climatização', 'Contratação de manutenção dos aparelhos de ar-condicionado, incluindo limpeza técnica e inspeções periódicas durante 12 meses.', 'Serviços', 3_600_000, now + 21 * day);
      const insertProposal = this.db.prepare('INSERT INTO proposals VALUES (?, ?, ?, ?, ?, ?, ?)');
      insertProposal.run(1, 1, 1, 'Alfa Tecnologia', 17_280_000, 'Entrega em até 30 dias. Garantia de 36 meses e suporte técnico local.', now);
      insertProposal.run(2, 1, 2, 'Beta Soluções', 16_840_000, 'Equipamentos conforme especificação do edital. Entrega em 25 dias.', now);
      insertProposal.run(3, 2, 1, 'Alfa Tecnologia', 5_280_000, 'Mobiliário com certificação e montagem incluída.', now - 3 * day);
      insertProposal.run(4, 2, 2, 'Beta Soluções', 5_140_000, 'Entrega e instalação em todos os ambientes previstos no edital.', now - 3 * day);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }

  authenticate(mode: LabMode, email: string, password: string): User | undefined {
    const columns = 'id, name, email, role, company';
    if (mode === 'vulneravel') {
      // VULNERABILIDADE INTENCIONAL A01 / CWE-89: entrada altera a consulta.
      // Ex.: email = ana@alfa.test' --  ignora a verificação da senha.
      const sql = `SELECT ${columns} FROM users WHERE email = '${email}' AND password_matches('${password}', password_hash) = 1`;
      try { return this.db.prepare(sql).get() as unknown as User | undefined; }
      catch { return undefined; }
    }
    // CORREÇÃO A01: parâmetros são dados, mesmo quando contêm sintaxe SQL.
    return this.db.prepare(`SELECT ${columns} FROM users WHERE email = ? AND password_matches(?, password_hash) = 1`).get(email, password) as unknown as User | undefined;
  }

  createSession(user: User) {
    const token = randomBytes(32).toString('hex');
    const csrf = randomBytes(24).toString('hex');
    this.db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
    this.db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?)').run(tokenHash(token), user.id, csrf, Date.now() + SESSION_TTL_SECONDS * 1000);
    return token;
  }

  session(token: string | undefined): Session | null {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const row = this.db.prepare(`SELECT u.id, u.name, u.email, u.role, u.company, s.csrf
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?`).get(tokenHash(token), Date.now());
    if (!row) return null;
    const { csrf, ...user } = row;
    return { user: user as unknown as User, csrf: String(csrf), tokenHash: tokenHash(token) };
  }

  revokeSession(hash: string) { this.db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hash); }
  tenders() { return this.db.prepare('SELECT * FROM tenders ORDER BY id').all() as unknown as Tender[]; }
  tender(id: number) { return this.db.prepare('SELECT * FROM tenders WHERE id = ?').get(id) as unknown as Tender | undefined; }
  closeTender(id: number) { this.db.prepare('UPDATE tenders SET deadline = ? WHERE id = ?').run(Date.now() - 1, id); }

  proposals(): Proposal[] {
    return this.db.prepare(`SELECT p.*, t.code AS tender_code, t.title AS tender_title, t.deadline
      FROM proposals p JOIN tenders t ON t.id = p.tender_id ORDER BY p.id`).all() as unknown as Proposal[];
  }

  proposal(id: number): Proposal | undefined {
    return this.db.prepare(`SELECT p.*, t.code AS tender_code, t.title AS tender_title, t.deadline
      FROM proposals p JOIN tenders t ON t.id = p.tender_id WHERE p.id = ?`).get(id) as unknown as Proposal | undefined;
  }

  createProposal(tender: Tender, user: User, cents: number, notes: string) {
    const result = this.db.prepare('INSERT INTO proposals(tender_id, user_id, company, value_cents, notes, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(tender.id, user.id, user.company!, cents, notes, Date.now());
    return Number(result.lastInsertRowid);
  }

  updateProposal(id: number, cents: number, notes: string) {
    this.db.prepare('UPDATE proposals SET value_cents = ?, notes = ?, updated_at = ? WHERE id = ?').run(cents, notes, Date.now(), id);
  }

  audit(actor: string, action: string, target: string, result: string) {
    this.db.prepare('INSERT INTO audit(created_at, actor, action, target, result) VALUES (?, ?, ?, ?, ?)').run(Date.now(), actor, action, target, result);
  }

  events() { return this.db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 100').all() as unknown as AuditEvent[]; }
  close() { this.db.close(); }
}

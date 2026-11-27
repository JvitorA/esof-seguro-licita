import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import type { LabMode } from '../src/types.js';

const payload = '<img src="/imagem-inexistente" onerror="document.body.dataset.xss=\'executou\'">';

for (const mode of ['vulneravel', 'corrigido'] as const) {
  describe(`Laboratório ${mode}`, () => {
    let app: FastifyInstance;
    let session: { cookie: string; csrf: string };

    async function login(email = 'ana@alfa.test', password = 'Alfa@123456') {
      const response = await app.inject({ method: 'POST', url: '/login', payload: { email, password } });
      const cookie = response.cookies.find((item) => item.name === `licita_${mode}`);
      return { response, cookie: cookie ? `${cookie.name}=${cookie.value}` : '' };
    }

    before(async () => {
      app = await buildApp({ mode, dbPath: ':memory:', logger: false });
      await app.ready();
      const result = await login();
      const page = await app.inject({ url: '/propostas/1/editar', headers: { cookie: result.cookie } });
      const csrf = page.body.match(/name="_csrf" value="([a-f0-9]+)"/)?.[1];
      assert.ok(csrf);
      session = { cookie: result.cookie, csrf };
    });
    after(async () => { await app.close(); });

    it('permite login válido e emite cookie HttpOnly específico do ambiente', async () => {
      const result = await login();
      assert.equal(result.response.statusCode, 303);
      assert.ok(result.cookie.startsWith(`licita_${mode}=`));
      assert.match(String(result.response.headers['set-cookie']), /HttpOnly/);
    });

    it('recusa senha incorreta e não emite sessão', async () => {
      const result = await login('ana@alfa.test', 'errada');
      assert.equal(result.response.statusCode, 401);
      assert.equal(result.cookie, '');
    });

    it('recusa usuário inexistente sem expor erro de SQL ou hash', async () => {
      const result = await login('nao-existe@alfa.test', 'errada');
      assert.equal(result.response.statusCode, 401);
      assert.doesNotMatch(result.response.body, /SQLITE|scrypt|SELECT/);
    });

    it('demonstra SQL injection no login e a correção por parametrização', async () => {
      const result = await login("ana@alfa.test' -- ", 'qualquer-senha');
      assert.equal(result.response.statusCode, mode === 'vulneravel' ? 303 : 401);
      assert.equal(Boolean(result.cookie), mode === 'vulneravel');
    });

    it('restringe a consulta de proposta de outra empresa na versão corrigida', async () => {
      const result = await app.inject({ url: '/propostas/2', headers: { cookie: session.cookie } });
      assert.equal(result.statusCode, mode === 'vulneravel' ? 200 : 403);
      if (mode === 'corrigido') assert.doesNotMatch(result.body, /168\.400/);
    });

    it('permite uma alteração legítima na proposta da própria empresa', async () => {
      const result = await app.inject({ method: 'POST', url: '/propostas/1/editar', headers: { cookie: session.cookie }, payload: { _csrf: session.csrf, value: '170000', notes: 'Entrega em 20 dias.' } });
      assert.equal(result.statusCode, 303);
      const view = await app.inject({ url: '/propostas/1', headers: { cookie: session.cookie } });
      assert.match(view.body, /170\.000/);
    });

    it('demonstra alteração cruzada por ID e confirma a integridade após a recusa', async () => {
      const result = await app.inject({ method: 'POST', url: '/propostas/2/editar', headers: { cookie: session.cookie }, payload: { _csrf: session.csrf, value: '1', notes: 'Alteração indevida' } });
      assert.equal(result.statusCode, mode === 'vulneravel' ? 303 : 403);
      const beta = await login('bruno@beta.test', 'Beta@123456');
      const view = await app.inject({ url: '/propostas/2', headers: { cookie: beta.cookie } });
      assert.match(view.body, mode === 'vulneravel' ? /Alteração indevida/ : /168\.400/);
    });

    it('persiste XSS e compara HTML executável com saída escapada em outra sessão', async () => {
      const update = await app.inject({ method: 'POST', url: '/propostas/1/editar', headers: { cookie: session.cookie }, payload: { _csrf: session.csrf, value: '172800', notes: payload } });
      assert.equal(update.statusCode, 303);
      const other = await login();
      const view = await app.inject({ url: '/propostas/1', headers: { cookie: other.cookie } });
      if (mode === 'vulneravel') assert.ok(view.body.includes(payload));
      else {
        assert.ok(!view.body.includes(payload));
        assert.match(view.body, /&lt;img src=&quot;/);
        assert.match(String(view.headers['content-security-policy']), /script-src 'self'/);
      }
    });

    it('recusa requisição sem sessão e token de sessão inventado', async () => {
      for (const cookie of ['', `licita_${mode}=forjado`]) {
        const result = await app.inject({ url: '/propostas/1', headers: { cookie } });
        assert.equal(result.statusCode, 303);
        assert.equal(result.headers.location, '/login');
      }
    });

    it('recusa alteração sem token CSRF', async () => {
      const result = await app.inject({ method: 'POST', url: '/propostas/1/editar', headers: { cookie: session.cookie }, payload: { value: '1', notes: 'CSRF' } });
      assert.equal(result.statusCode, 403);
    });

    it('recusa valor inválido sem modificar a proposta', async () => {
      for (const value of ['-1', 'NaN', '0', 'Infinity', '1.001']) {
        const result = await app.inject({ method: 'POST', url: '/propostas/1/editar', headers: { cookie: session.cookie }, payload: { _csrf: session.csrf, value, notes: 'Inválido' } });
        assert.equal(result.statusCode, 400, `valor ${value}`);
      }
    });

    it('não expõe propostas sigilosas na listagem do fornecedor', async () => {
      const result = await app.inject({ url: '/propostas', headers: { cookie: session.cookie } });
      assert.equal(result.statusCode, 200);
      assert.doesNotMatch(result.body, /href="\/propostas\/2"/);
    });

    it('impede a comissão de ler propostas antes do encerramento', async () => {
      const carla = await login('carla@comissao.test', 'Comissao@123456');
      const result = await app.inject({ url: '/propostas/1', headers: { cookie: carla.cookie } });
      assert.equal(result.statusCode, 403);
    });

    it('recusa criação duplicada e cria uma proposta vinculada à empresa da sessão', async () => {
      const duplicate = await app.inject({ method: 'POST', url: '/licitacoes/1/propostas', headers: { cookie: session.cookie }, payload: { _csrf: session.csrf, value: '1000', notes: 'Duplicada' } });
      assert.equal(duplicate.statusCode, 409);
      const created = await app.inject({ method: 'POST', url: '/licitacoes/3/propostas', headers: { cookie: session.cookie }, payload: { _csrf: session.csrf, value: '25000', notes: 'Nova proposta', company: 'Beta' } });
      assert.equal(created.statusCode, 303);
      const result = await app.inject({ url: created.headers.location!, headers: { cookie: session.cookie } });
      assert.match(result.body, /Alfa Tecnologia/);
      assert.doesNotMatch(result.body, /Beta Soluções/);
    });

    it('restringe auditoria à administração e registra as recusas', async () => {
      const denied = await app.inject({ url: '/auditoria', headers: { cookie: session.cookie } });
      assert.equal(denied.statusCode, 403);
      const admin = await login('admin@licita.test', 'Admin@123456');
      const audit = await app.inject({ url: '/auditoria', headers: { cookie: admin.cookie } });
      assert.equal(audit.statusCode, 200);
      assert.match(audit.body, /NEGADO/);
    });

    it('encerra a licitação com servidor, bloqueia edição e libera leitura à comissão', async () => {
      const sergio = await login('sergio@licita.test', 'Servidor@123456');
      const dashboard = await app.inject({ url: '/licitacoes/1', headers: { cookie: sergio.cookie } });
      const csrf = dashboard.body.match(/name="_csrf" value="([a-f0-9]+)"/)?.[1];
      const end = await app.inject({ method: 'POST', url: '/licitacoes/1/encerrar', headers: { cookie: sergio.cookie }, payload: { _csrf: csrf } });
      assert.equal(end.statusCode, 303);
      const update = await app.inject({ method: 'POST', url: '/propostas/1/editar', headers: { cookie: session.cookie }, payload: { _csrf: session.csrf, value: '1000', notes: 'Fora do prazo' } });
      assert.equal(update.statusCode, 403);
      const carla = await login('carla@comissao.test', 'Comissao@123456');
      const view = await app.inject({ url: '/propostas/1', headers: { cookie: carla.cookie } });
      assert.equal(view.statusCode, 200);
    });

    it('revoga a sessão no logout', async () => {
      const result = await app.inject({ method: 'POST', url: '/logout', headers: { cookie: session.cookie }, payload: { _csrf: session.csrf } });
      assert.equal(result.statusCode, 303);
      const view = await app.inject({ url: '/propostas/1', headers: { cookie: session.cookie } });
      assert.equal(view.statusCode, 303);
    });
  });
}

describe('Configuração e isolamento', () => {
  it('aceita o login da mesma origem e recusa origem opaca ou de outro site', async () => {
    const app = await buildApp({ mode: 'vulneravel', dbPath: ':memory:' });
    try {
      const page = await app.inject({ url: '/login' });
      assert.equal(page.headers['referrer-policy'], 'same-origin');
      const headers = { host: '127.0.0.1:3000' };
      const same = await app.inject({ method: 'POST', url: '/login', headers: { ...headers, origin: 'http://127.0.0.1:3000' }, payload: { email: 'ana@alfa.test', password: 'Alfa@123456' } });
      assert.equal(same.statusCode, 303);
      const cross = await app.inject({ method: 'POST', url: '/login', headers: { ...headers, origin: 'http://evil.test' }, payload: { email: 'ana@alfa.test', password: 'Alfa@123456' } });
      assert.equal(cross.statusCode, 403);
      const opaque = await app.inject({ method: 'POST', url: '/login', headers: { ...headers, origin: 'null' }, payload: { email: 'ana@alfa.test', password: 'Alfa@123456' } });
      assert.equal(opaque.statusCode, 403);
    } finally { await app.close(); }
  });

  it('recusa modo desconhecido para não iniciar vulnerável por engano', async () => {
    await assert.rejects(buildApp({ mode: 'invalido' as LabMode, dbPath: ':memory:' }));
  });

  it('não aceita cookie de um ambiente no outro', async () => {
    const vulnerable = await buildApp({ mode: 'vulneravel', dbPath: ':memory:' });
    const corrected = await buildApp({ mode: 'corrigido', dbPath: ':memory:' });
    try {
      const login = await vulnerable.inject({ method: 'POST', url: '/login', payload: { email: 'ana@alfa.test', password: 'Alfa@123456' } });
      const cookie = login.cookies.map((item) => `${item.name}=${item.value}`).join('; ');
      const result = await corrected.inject({ url: '/propostas/1', headers: { cookie } });
      assert.equal(result.statusCode, 303);
    } finally { await vulnerable.close(); await corrected.close(); }
  });
});

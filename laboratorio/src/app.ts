import Fastify from 'fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import formbody from '@fastify/formbody';
import { readFileSync } from 'node:fs';
import { Store, SESSION_TTL_SECONDS } from './database.js';
import { canEditProposal, canReadProposal, visibleProposals } from './policy.js';
import type { LabMode, Proposal, Session, Tender } from './types.js';
import { auditView, errorView, homeView, loginView, proposalForm, proposalsView, proposalView, tendersView, tenderView } from './views.js';
import type { ViewContext } from './views.js';

declare module 'fastify' { interface FastifyRequest { labSession: Session | null } }
interface AppOptions { mode: LabMode; dbPath: string; logger?: boolean }
type ResourceRoute = { Params: { id: string } };
const fields = (body: unknown): Record<string, unknown> => body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
const resourceId = (value: string) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : -1;

export async function buildApp(options: AppOptions) {
  const { mode } = options;
  if (mode !== 'vulneravel' && mode !== 'corrigido') throw new Error('Modo de laboratório inválido.');
  const store = new Store(options.dbPath);
  const app = Fastify({ logger: options.logger ?? false, bodyLimit: 16_384 });
  const cookieName = `licita_${mode}`;
  await app.register(cookie);
  await app.register(formbody);
  app.decorateRequest('labSession', null);
  app.addHook('onClose', async () => { store.close(); });

  const ctx = (request: FastifyRequest): ViewContext => ({ mode, user: request.labSession?.user ?? null, csrf: request.labSession?.csrf ?? '' });
  const html = (reply: FastifyReply, content: string, code = 200) => reply.code(code).type('text/html; charset=utf-8').send(content);
  const fail = (request: FastifyRequest, reply: FastifyReply, code: number, message: string) => html(reply, errorView(ctx(request), code, message), code);
  const requireUser = (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.labSession) { reply.redirect('/login', 303); return null; }
    return request.labSession.user;
  };
  const denied = (request: FastifyRequest, reply: FastifyReply, target: string) => {
    store.audit(request.labSession?.user.email ?? 'anônimo', 'acesso', target, 'NEGADO');
    return fail(request, reply, 403, 'Seu perfil, empresa ou o prazo da licitação não permite esta operação.');
  };

  app.addHook('onRequest', async (request, reply) => {
    request.labSession = store.session(request.cookies[cookieName]);
    reply.header('Cache-Control', 'no-store');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    // no-referrer faria o navegador enviar "Origin: null" em todo POST e o login receberia 403.
    reply.header('Referrer-Policy', 'same-origin');
    if (mode === 'corrigido') reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  });

  app.addHook('preHandler', async (request, reply) => {
    if (request.method !== 'POST') return;
    const origin = request.headers.origin;
    if (origin) {
      try {
        if (new URL(origin).host !== request.headers.host) return denied(request, reply, 'origem da requisição');
      } catch { return denied(request, reply, 'origem da requisição'); }
    }
    if (request.routeOptions.url === '/login') return;
    if (!requireUser(request, reply)) return reply;
    const csrf = fields(request.body)._csrf ?? request.headers['x-csrf-token'];
    if (typeof csrf !== 'string' || csrf !== request.labSession!.csrf) return denied(request, reply, 'token CSRF');
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'Falha ao processar solicitação');
    const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;
    return fail(request, reply, statusCode >= 400 && statusCode < 500 ? statusCode : 500, 'A solicitação não pôde ser processada. Confira os dados e tente novamente.');
  });
  app.setNotFoundHandler((request, reply) => fail(request, reply, 404, 'O endereço solicitado não foi encontrado.'));

  const css = readFileSync(new URL('../public/style.css', import.meta.url), 'utf8');
  const logo = readFileSync(new URL('../public/logo-licita.png', import.meta.url));
  const favicon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="#00284a"/><g transform="rotate(-35 20 18)"><rect x="9" y="7" width="20" height="5" rx="2" fill="#009c86"/><path d="M12 13h14v10H12z" fill="white"/><rect x="9" y="24" width="20" height="5" rx="2" fill="#009c86"/><path d="M27 17h9v5h-9z" fill="white"/></g></svg>';
  app.get('/assets/style.css', async (_request, reply) => reply.type('text/css; charset=utf-8').send(css));
  app.get('/assets/logo-licita.png', async (_request, reply) => reply.type('image/png').send(logo));
  app.get('/assets/favicon.svg', async (_request, reply) => reply.type('image/svg+xml').send(favicon));
  app.get('/health', async () => ({ status: 'ok', mode }));
  app.get('/login', async (request, reply) => request.labSession ? reply.redirect('/', 303) : html(reply, loginView(ctx(request))));
  app.post('/login', async (request, reply) => {
    const body = fields(request.body);
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || email.length > 254 || !password || password.length > 512) return html(reply, loginView(ctx(request), 'Informe um e-mail e uma senha válidos.'), 400);
    const user = store.authenticate(mode, email, password);
    if (!user) {
      store.audit('anônimo', 'login', 'conta', 'FALHA');
      return html(reply, loginView(ctx(request), 'E-mail ou senha inválidos.', email), 401);
    }
    if (request.labSession) store.revokeSession(request.labSession.tokenHash);
    const token = store.createSession(user);
    reply.setCookie(cookieName, token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: SESSION_TTL_SECONDS });
    store.audit(user.email, 'login', 'conta', 'OK');
    return reply.redirect('/', 303);
  });
  app.post('/logout', async (request, reply) => {
    store.audit(request.labSession!.user.email, 'logout', 'conta', 'OK');
    store.revokeSession(request.labSession!.tokenHash);
    return reply.clearCookie(cookieName, { path: '/' }).redirect('/login', 303);
  });

  app.get('/', async (request, reply) => {
    const user = requireUser(request, reply); if (!user) return reply;
    return html(reply, homeView(ctx(request), store.tenders(), visibleProposals(user, store.proposals())));
  });
  app.get<{ Querystring: { q?: string } }>('/licitacoes', async (request, reply) => {
    if (!requireUser(request, reply)) return reply;
    const query = typeof request.query.q === 'string' ? request.query.q.slice(0, 200) : '';
    const list = store.tenders().filter((tender) => `${tender.title} ${tender.code} ${tender.category}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
    return html(reply, tendersView(ctx(request), list, query));
  });
  app.get<ResourceRoute>('/licitacoes/:id', async (request, reply) => {
    const user = requireUser(request, reply); if (!user) return reply;
    const tender = store.tender(resourceId(request.params.id));
    if (!tender) return fail(request, reply, 404, 'Licitação não encontrada.');
    return html(reply, tenderView(ctx(request), tender, visibleProposals(user, store.proposals()).filter((proposal) => proposal.tender_id === tender.id)));
  });
  app.post<ResourceRoute>('/licitacoes/:id/encerrar', async (request, reply) => {
    const user = request.labSession!.user;
    if (user.role !== 'servidor') return denied(request, reply, 'encerrar licitação');
    const tender = store.tender(resourceId(request.params.id));
    if (!tender) return fail(request, reply, 404, 'Licitação não encontrada.');
    store.closeTender(tender.id);
    store.audit(user.email, 'licitacao.encerrar', String(tender.id), 'OK');
    return reply.redirect(`/licitacoes/${tender.id}`, 303);
  });

  function newProposalContext(request: FastifyRequest<ResourceRoute>, reply: FastifyReply): Tender | null {
    const user = requireUser(request, reply); if (!user) return null;
    const tender = store.tender(resourceId(request.params.id));
    if (!tender) { fail(request, reply, 404, 'Licitação não encontrada.'); return null; }
    if (user.role !== 'fornecedor' || Date.now() >= tender.deadline) { denied(request, reply, 'nova proposta'); return null; }
    if (store.proposals().some((proposal) => proposal.tender_id === tender.id && proposal.company === user.company)) {
      fail(request, reply, 409, 'Sua empresa já tem uma proposta nesta licitação. Consulte a proposta existente para editá-la.');
      return null;
    }
    return tender;
  }
  function proposalFields(body: unknown): { cents: number; notes: string } | null {
    const input = fields(body);
    const value = typeof input.value === 'string' || typeof input.value === 'number' ? String(input.value) : '';
    const notes = typeof input.notes === 'string' ? input.notes : '';
    if (!/^\d{1,9}(\.\d{1,2})?$/.test(value) || !notes.trim() || notes.length > 4000) return null;
    const cents = Math.round(Number(value) * 100);
    return cents > 0 && Number.isSafeInteger(cents) ? { cents, notes } : null;
  }
  app.get<ResourceRoute>('/licitacoes/:id/propostas/nova', async (request, reply) => {
    const tender = newProposalContext(request, reply); if (!tender) return reply;
    return html(reply, proposalForm(ctx(request), tender));
  });
  app.post<ResourceRoute>('/licitacoes/:id/propostas', async (request, reply) => {
    const tender = newProposalContext(request, reply); if (!tender) return reply;
    const input = proposalFields(request.body);
    if (!input) return html(reply, proposalForm(ctx(request), tender, undefined, 'Informe um valor positivo com até duas casas decimais e observações de até 4.000 caracteres.'), 400);
    const id = store.createProposal(tender, request.labSession!.user, input.cents, input.notes);
    store.audit(request.labSession!.user.email, 'proposta.criar', String(id), 'OK');
    return reply.redirect(`/propostas/${id}`, 303);
  });
  app.get('/propostas', async (request, reply) => {
    const user = requireUser(request, reply); if (!user) return reply;
    return html(reply, proposalsView(ctx(request), visibleProposals(user, store.proposals())));
  });

  function authorizedProposal(request: FastifyRequest<ResourceRoute>, reply: FastifyReply, edit: boolean): Proposal | null {
    const user = requireUser(request, reply); if (!user) return null;
    const proposal = store.proposal(resourceId(request.params.id));
    if (!proposal) { fail(request, reply, 404, 'Proposta não encontrada.'); return null; }
    const allowed = edit ? canEditProposal(mode, user, proposal) : canReadProposal(mode, user, proposal);
    if (!allowed) { denied(request, reply, `proposta:${proposal.id}`); return null; }
    return proposal;
  }
  app.get<ResourceRoute>('/propostas/:id', async (request, reply) => {
    const proposal = authorizedProposal(request, reply, false); if (!proposal) return reply;
    store.audit(request.labSession!.user.email, 'proposta.ler', String(proposal.id), 'OK');
    return html(reply, proposalView(ctx(request), proposal, canEditProposal(mode, request.labSession!.user, proposal)));
  });
  app.get<ResourceRoute>('/propostas/:id/editar', async (request, reply) => {
    const proposal = authorizedProposal(request, reply, true); if (!proposal) return reply;
    return html(reply, proposalForm(ctx(request), store.tender(proposal.tender_id)!, proposal));
  });
  app.post<ResourceRoute>('/propostas/:id/editar', async (request, reply) => {
    const proposal = authorizedProposal(request, reply, true); if (!proposal) return reply;
    const input = proposalFields(request.body);
    if (!input) return html(reply, proposalForm(ctx(request), store.tender(proposal.tender_id)!, proposal, 'Informe um valor positivo com até duas casas decimais e observações de até 4.000 caracteres.'), 400);
    store.updateProposal(proposal.id, input.cents, input.notes);
    store.audit(request.labSession!.user.email, 'proposta.alterar', String(proposal.id), 'OK');
    return reply.redirect(`/propostas/${proposal.id}`, 303);
  });
  app.get('/auditoria', async (request, reply) => {
    const user = requireUser(request, reply); if (!user) return reply;
    if (user.role !== 'admin') return denied(request, reply, 'auditoria');
    return html(reply, auditView(ctx(request), store.events()));
  });
  return app;
}

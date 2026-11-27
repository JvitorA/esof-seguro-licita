import type { AuditEvent, LabMode, Proposal, Tender, User } from './types.js';

export interface ViewContext { mode: LabMode; user: User | null; csrf: string }
export const escapeHtml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
export const money = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const date = (timestamp: number) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(timestamp);
const roleName = { fornecedor: 'Fornecedor', comissao: 'Comissão de licitação', servidor: 'Servidor público', admin: 'Administração' };
const csrfInput = (ctx: ViewContext) => `<input type="hidden" name="_csrf" value="${escapeHtml(ctx.csrf)}">`;
const status = (deadline: number) => Date.now() < deadline ? '<span class="status open">Recebendo propostas</span>' : '<span class="status review">Em análise</span>';

function icon(name: string) {
  const paths: Record<string, string> = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    building: '<path d="M4 21V7l8-4 8 4v14M2 21h20M9 21v-5h6v5M8 8h1M15 8h1M8 12h1M15 12h1"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.file}</svg>`;
}

export function layout(ctx: ViewContext, title: string, section: string, content: string) {
  const user = ctx.user;
  const nav = (path: string, label: string, key: string, glyph: string) => `<a href="${path}" class="nav-item ${section === key ? 'active' : ''}" ${section === key ? 'aria-current="page"' : ''}>${icon(glyph)}${label}</a>`;
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)} · Licita+</title><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/style.css"></head>
<body class="${user ? '' : 'auth-page'}">
<aside class="sidebar"><a class="brand" href="/" aria-label="Licita+, início"><img class="brand-logo" src="/assets/logo-licita.png" alt="LICITA+ — Licitação Eletrônica" width="1536" height="1024"></a>
${user ? `<div class="workspace"><span class="eyebrow">AMBIENTE DE TRABALHO</span><strong>Compras institucionais</strong><span>Universidade · demonstração</span></div><nav aria-label="Menu principal">${nav('/', 'Visão geral', 'home', 'grid')}${nav('/licitacoes', 'Licitações', 'tenders', 'building')}${nav('/propostas', user.role === 'comissao' ? 'Analisar propostas' : 'Minhas propostas', 'proposals', 'file')}${user.role === 'admin' ? nav('/auditoria', 'Auditoria', 'audit', 'shield') : ''}</nav>` : `<div class="auth-promise"><span class="eyebrow">COMPRAS PÚBLICAS</span><h2>Transparência em cada etapa.</h2><p>Um espaço para conectar fornecedores e instituições, da proposta à decisão.</p></div>`}
<div class="sidebar-bottom">${icon('shield')}<span>Projeto acadêmico<small>Engenharia de Software Seguro</small></span></div></aside>
<div class="app-shell"><header class="topbar"><span class="breadcrumb">Portal do fornecedor <span>/</span> ${escapeHtml(title)}</span><div class="topbar-right"><span class="mode ${ctx.mode}">${ctx.mode === 'vulneravel' ? 'Ambiente vulnerável' : 'Ambiente corrigido'}</span>${user ? `<span class="avatar">${escapeHtml(user.name.split(' ').map((word) => word[0]).slice(0, 2).join(''))}</span>` : ''}</div></header>
<main id="conteudo">${content}</main><footer class="page-footer"><span>Licita+ · Laboratório de segurança</span><span>Dados fictícios · uso local</span></footer></div></body></html>`;
}

const heading = (eyebrow: string, title: string, subtitle: string) => `<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${subtitle}</p></div></div>`;

export function loginView(ctx: ViewContext, error = '', email = '') {
  return layout(ctx, 'Acessar o portal', 'login', `<section class="login-wrap"><div class="login-intro"><span class="eyebrow">BEM-VINDO AO LICITA+</span><h1>Seu próximo contrato<br>começa aqui.</h1><p>Acompanhe licitações e gerencie suas propostas<br class="desktop-only"> em um único lugar.</p></div><div class="login-card"><div class="card-title">${icon('shield')}<div><h2>Acesse sua conta</h2><p>Entre com suas credenciais para continuar.</p></div></div>${error ? `<div class="notice error" role="alert">${escapeHtml(error)}</div>` : ''}<form method="post" action="/login"><label for="email">E-mail</label><input id="email" name="email" type="text" inputmode="email" autocomplete="username" required maxlength="254" placeholder="voce@empresa.com.br" value="${escapeHtml(email)}"><label for="password">Senha</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="512" placeholder="Digite sua senha"><button class="button primary full" type="submit">Entrar no portal</button></form><div class="login-note">${icon('shield')} Este é um laboratório com dados fictícios.</div></div><details class="demo-accounts"><summary>Contas de demonstração</summary><p>Use as mesmas contas nos dois ambientes.</p><dl><div><dt>Fornecedor Alfa</dt><dd>ana@alfa.test <code>Alfa@123456</code></dd></div><div><dt>Fornecedor Beta</dt><dd>bruno@beta.test <code>Beta@123456</code></dd></div><div><dt>Comissão</dt><dd>carla@comissao.test <code>Comissao@123456</code></dd></div><div><dt>Servidor público</dt><dd>sergio@licita.test <code>Servidor@123456</code></dd></div><div><dt>Administração</dt><dd>admin@licita.test <code>Admin@123456</code></dd></div></dl></details></section>`);
}

function tenderCards(tenders: Tender[]) {
  return tenders.map((tender) => `<article class="tender-card"><div class="tender-card-top"><span class="tender-code">${escapeHtml(tender.code)}</span>${status(tender.deadline)}</div><span class="category">${escapeHtml(tender.category)}</span><h3><a href="/licitacoes/${tender.id}">${escapeHtml(tender.title)}</a></h3><p>${escapeHtml(tender.description)}</p><div class="tender-meta"><div><span>Valor estimado</span><strong>${money(tender.estimate)}</strong></div><div><span>Encerramento</span><strong>${date(tender.deadline)}</strong></div></div><a class="card-link" href="/licitacoes/${tender.id}">Consultar licitação</a></article>`).join('');
}

export function homeView(ctx: ViewContext, tenders: Tender[], proposals: Proposal[]) {
  const user = ctx.user!;
  const firstName = escapeHtml(user.name.split(' ')[0]);
  const open = tenders.filter((tender) => tender.deadline > Date.now()).length;
  return layout(ctx, 'Visão geral', 'home', `${heading('SEU PAINEL', `Olá, ${firstName}.`, 'Acompanhe as oportunidades e as próximas etapas das suas propostas.')}<section class="welcome-panel"><div><span class="eyebrow">${escapeHtml(roleName[user.role].toUpperCase())}</span><h2>${escapeHtml(user.company ?? 'Compras com responsabilidade.')}</h2><p>${user.role === 'fornecedor' ? 'Suas propostas ficam sob sigilo até o encerramento do recebimento.' : 'Acompanhe cada etapa respeitando os perfis de acesso e os prazos.'}</p><a class="button light" href="/licitacoes">Explorar licitações</a></div><div class="welcome-art" aria-hidden="true">${icon('file')}<span class="art-check">✓</span></div></section><section class="stats" aria-label="Resumo do portal"><article class="stat-card"><span class="stat-icon">${icon('building')}</span><div><span>Licitações abertas</span><strong>${open.toString().padStart(2, '0')}</strong><small>Recebendo propostas</small></div></article><article class="stat-card"><span class="stat-icon blue">${icon('file')}</span><div><span>Propostas disponíveis</span><strong>${proposals.length.toString().padStart(2, '0')}</strong><small>Conforme seu perfil de acesso</small></div></article><article class="stat-card"><span class="stat-icon amber">${icon('clock')}</span><div><span>Licitações em análise</span><strong>${(tenders.length - open).toString().padStart(2, '0')}</strong><small>Recebimento encerrado</small></div></article></section><section><div class="section-heading"><div><h2>Licitações em destaque</h2><p>Oportunidades para sua empresa.</p></div><a class="text-link" href="/licitacoes">Ver todas as licitações</a></div><div class="tender-grid">${tenderCards(tenders.slice(0, 2))}</div></section>${accountPanel(ctx)}`);
}

function accountPanel(ctx: ViewContext) {
  return `<section class="account-panel"><div class="account-copy">${icon('shield')}<div><strong>${escapeHtml(ctx.user!.name)}</strong><span>${escapeHtml(ctx.user!.email)} · ${roleName[ctx.user!.role]}</span></div></div><form method="post" action="/logout">${csrfInput(ctx)}<button class="button secondary small" type="submit">Sair da conta</button></form></section>`;
}

export function tendersView(ctx: ViewContext, tenders: Tender[], query: string) {
  return layout(ctx, 'Licitações', 'tenders', `${heading('OPORTUNIDADES', 'Licitações', 'Consulte os editais, acompanhe os prazos e prepare sua proposta.')}<form class="search-form" action="/licitacoes" method="get"><label class="sr-only" for="q">Buscar licitações</label><input id="q" name="q" placeholder="Buscar por objeto, número ou categoria" value="${escapeHtml(query)}"><button class="button primary" type="submit">Buscar</button></form><div class="section-heading"><p>${tenders.length} licitações encontradas</p>${query ? '<a class="text-link" href="/licitacoes">Limpar busca</a>' : ''}</div><div class="tender-grid">${tenderCards(tenders) || '<div class="empty-state">Nenhuma licitação encontrada para esta busca.</div>'}</div>`);
}

export function tenderView(ctx: ViewContext, tender: Tender, proposals: Proposal[]) {
  const open = Date.now() < tender.deadline;
  const owned = proposals.find((proposal) => proposal.company === ctx.user!.company);
  return layout(ctx, tender.code, 'tenders', `<a class="back-link" href="/licitacoes">Voltar para licitações</a>${heading(escapeHtml(tender.code), escapeHtml(tender.title), 'Universidade · Compras institucionais')}<div class="detail-grid"><section class="panel"><div class="panel-heading"><h2>Objeto da contratação</h2>${status(tender.deadline)}</div><p class="description">${escapeHtml(tender.description)}</p><dl class="metadata"><div><dt>Modalidade</dt><dd>Pregão eletrônico</dd></div><div><dt>Categoria</dt><dd>${escapeHtml(tender.category)}</dd></div><div><dt>Valor estimado</dt><dd>${money(tender.estimate)}</dd></div><div><dt>Fim do recebimento</dt><dd>${date(tender.deadline)}</dd></div></dl>${ctx.user!.role === 'servidor' && open ? `<form class="border-top" method="post" action="/licitacoes/${tender.id}/encerrar">${csrfInput(ctx)}<p class="muted">Avance o ciclo do laboratório para liberar a análise pela comissão.</p><button class="button secondary" type="submit">Encerrar recebimento</button></form>` : ''}</section><aside class="panel action-panel">${icon('file')}<h2>${owned ? 'Sua proposta foi recebida' : 'Participe desta licitação'}</h2><p>${owned ? 'Consulte o conteúdo enviado e acompanhe o andamento.' : open ? 'Envie o valor e as condições comerciais antes do encerramento.' : 'O prazo para envio de propostas foi encerrado.'}</p>${ctx.user!.role === 'fornecedor' ? owned ? `<a class="button primary full" href="/propostas/${owned.id}">Consultar minha proposta</a>` : open ? `<a class="button primary full" href="/licitacoes/${tender.id}/propostas/nova">Preparar proposta</a>` : '' : '<a class="button secondary full" href="/propostas">Consultar propostas disponíveis</a>'}<small>O conteúdo é apresentado conforme as permissões do seu perfil.</small></aside></div>${proposals.length ? `<section class="panel spaced"><div class="panel-heading"><h2>Propostas disponíveis</h2></div>${proposalTable(proposals)}</section>` : ''}`);
}

function proposalTable(proposals: Proposal[]) {
  if (!proposals.length) return '<div class="empty-state">Nenhuma proposta disponível para seu perfil neste momento.</div>';
  return `<div class="table-scroll"><table><thead><tr><th>Protocolo / licitação</th><th>Empresa</th><th>Valor proposto</th><th>Situação</th><th><span class="sr-only">Ação</span></th></tr></thead><tbody>${proposals.map((proposal) => `<tr><td><strong>PR-${String(proposal.id).padStart(4, '0')}</strong><small>${escapeHtml(proposal.tender_code)}</small></td><td>${escapeHtml(proposal.company)}</td><td class="numeric">${money(proposal.value_cents)}</td><td>${status(proposal.deadline)}</td><td><a class="text-link" href="/propostas/${proposal.id}">Consultar</a></td></tr>`).join('')}</tbody></table></div>`;
}

export function proposalsView(ctx: ViewContext, proposals: Proposal[]) {
  return layout(ctx, 'Propostas', 'proposals', `${heading('ACOMPANHAMENTO', ctx.user!.role === 'comissao' ? 'Análise de propostas' : 'Minhas propostas', 'Consulte as propostas disponíveis para o seu perfil de acesso.')}<section class="panel"><div class="panel-heading"><h2>Propostas recebidas</h2><span class="count">${proposals.length}</span></div>${proposalTable(proposals)}</section>`);
}

export function proposalView(ctx: ViewContext, proposal: Proposal, editable: boolean) {
  // VULNERABILIDADE INTENCIONAL A03 / CWE-79: somente este campo aceita HTML
  // no ambiente vulnerável. A versão corrigida codifica o texto na saída.
  const notes = ctx.mode === 'vulneravel' ? proposal.notes : escapeHtml(proposal.notes);
  return layout(ctx, `Proposta PR-${String(proposal.id).padStart(4, '0')}`, 'proposals', `<a class="back-link" href="/propostas">Voltar para propostas</a>${heading(escapeHtml(proposal.tender_code), `Proposta PR-${String(proposal.id).padStart(4, '0')}`, escapeHtml(proposal.tender_title))}<div class="detail-grid"><section class="panel"><div class="panel-heading"><h2>Condições comerciais</h2>${status(proposal.deadline)}</div><dl class="metadata"><div><dt>Empresa proponente</dt><dd>${escapeHtml(proposal.company)}</dd></div><div><dt>Última atualização</dt><dd>${date(proposal.updated_at)}</dd></div></dl><h3 class="notes-title">Observações da proposta</h3><div class="proposal-notes">${notes}</div></section><aside class="panel action-panel"><span class="eyebrow">VALOR TOTAL PROPOSTO</span><strong class="proposal-price">${money(proposal.value_cents)}</strong><p>O valor inclui as condições informadas pela empresa.</p>${editable ? `<a class="button primary full" href="/propostas/${proposal.id}/editar">Editar proposta</a>` : '<div class="notice">Proposta disponível somente para consulta.</div>'}<a class="text-link spaced-link" href="/licitacoes/${proposal.tender_id}">Consultar licitação</a></aside></div>`);
}

export function proposalForm(ctx: ViewContext, tender: Tender, proposal?: Proposal, error = '') {
  const action = proposal ? `/propostas/${proposal.id}/editar` : `/licitacoes/${tender.id}/propostas`;
  return layout(ctx, proposal ? 'Editar proposta' : 'Nova proposta', 'proposals', `<a class="back-link" href="/licitacoes/${tender.id}">Voltar para licitação</a>${heading(escapeHtml(tender.code), proposal ? 'Editar proposta' : 'Preparar proposta', escapeHtml(tender.title))}<section class="panel form-panel">${error ? `<div class="notice error" role="alert">${escapeHtml(error)}</div>` : ''}<form action="${action}" method="post">${csrfInput(ctx)}<div class="field-hint">Empresa proponente <strong>${escapeHtml(proposal?.company ?? ctx.user!.company)}</strong></div><label for="value">Valor total da proposta (R$)</label><input class="value-input" id="value" name="value" type="number" min="0.01" max="999999999.99" step="0.01" required value="${proposal ? (proposal.value_cents / 100).toFixed(2) : ''}" placeholder="0,00"><label for="notes">Observações da proposta</label><p class="input-hint" id="notes-hint">Descreva prazos de entrega, garantia e outras condições comerciais.</p><textarea id="notes" name="notes" rows="7" maxlength="4000" required aria-describedby="notes-hint">${escapeHtml(proposal?.notes ?? '')}</textarea><div class="form-actions"><a class="button secondary" href="/licitacoes/${tender.id}">Cancelar</a><button class="button primary" type="submit">${proposal ? 'Salvar alterações' : 'Enviar proposta'}</button></div></form></section>`);
}

export function errorView(ctx: ViewContext, code: number, message: string) {
  return layout(ctx, `Solicitação ${code}`, '', `<section class="panel error-panel">${icon('shield')}<span class="eyebrow">SOLICITAÇÃO ${code}</span><h1>${code === 403 ? 'Acesso não permitido' : code === 404 ? 'Página não encontrada' : 'Não foi possível continuar'}</h1><p>${escapeHtml(message)}</p><a class="button primary" href="/">Voltar ao início</a></section>`);
}

export function auditView(ctx: ViewContext, events: AuditEvent[]) {
  return layout(ctx, 'Auditoria', 'audit', `${heading('RASTREABILIDADE', 'Eventos de auditoria', 'Últimos 100 eventos deste ambiente. Senhas e tokens não são registrados.')}<section class="panel"><div class="table-scroll"><table><thead><tr><th>Horário</th><th>Usuário</th><th>Ação</th><th>Recurso</th><th>Resultado</th></tr></thead><tbody>${events.map((event) => `<tr><td class="nowrap">${date(event.created_at)}</td><td>${escapeHtml(event.actor)}</td><td>${escapeHtml(event.action)}</td><td>${escapeHtml(event.target)}</td><td><span class="status ${event.result === 'NEGADO' ? 'denied' : 'review'}">${escapeHtml(event.result)}</span></td></tr>`).join('')}</tbody></table></div></section>`);
}

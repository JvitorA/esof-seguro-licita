import type { LabMode, Proposal, User } from './types.js';

export function canReadProposal(mode: LabMode, user: User, proposal: Proposal): boolean {
  if (user.role === 'comissao') return Date.now() >= proposal.deadline;
  if (user.role !== 'fornecedor') return false;
  // VULNERABILIDADE INTENCIONAL A02 / CWE-639: falta vínculo com o objeto.
  if (mode === 'vulneravel') return true;
  return user.company === proposal.company;
}

export function canEditProposal(mode: LabMode, user: User, proposal: Proposal): boolean {
  if (user.role !== 'fornecedor' || Date.now() >= proposal.deadline) return false;
  // CORREÇÃO A02: a identidade autenticada precisa pertencer à empresa titular.
  return mode === 'vulneravel' || user.company === proposal.company;
}

// A interface lista somente o que cada perfil deveria consultar, nos dois modos.
// A02 demonstra por que ocultar o link não substitui a autorização no endpoint.
export function visibleProposals(user: User, proposals: Proposal[]): Proposal[] {
  if (user.role === 'fornecedor') return proposals.filter((proposal) => proposal.company === user.company);
  if (user.role === 'comissao') return proposals.filter((proposal) => Date.now() >= proposal.deadline);
  return [];
}

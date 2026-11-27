export type LabMode = 'vulneravel' | 'corrigido';
export type Role = 'fornecedor' | 'comissao' | 'servidor' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  company: string | null;
}

export interface Session {
  user: User;
  csrf: string;
  tokenHash: string;
}

export interface Tender {
  id: number;
  code: string;
  title: string;
  description: string;
  category: string;
  estimate: number;
  deadline: number;
}

export interface Proposal {
  id: number;
  tender_id: number;
  user_id: number;
  company: string;
  value_cents: number;
  notes: string;
  updated_at: number;
  tender_code: string;
  tender_title: string;
  deadline: number;
}

export interface AuditEvent {
  id: number;
  created_at: number;
  actor: string;
  action: string;
  target: string;
  result: string;
}

# ETAPA 2 — Análise, Priorização e Tratamento de Riscos com o NIST CSF 2.0

## Sistema de Licitações Eletrônicas — Licita+


## 1. Objetivo

Esta etapa identificou os eventos de risco a partir das ameaças levantadas no modelo STRIDE, na Etapa 1.

O grupo decidiu consolidar em um único evento de risco as ameaças que fazem parte do mesmo cenário, evitando duplicações. Assim, foram registrados 12 riscos, cada um associado a um caso de abuso, mantendo a cobertura de todas as ameaças T-01 a T-21.

## 2. Critérios de avaliação

### 2.1 Critérios de probabilidade

| Valor | Classificação | Critério |
|---:|---|---|
| 1 | Baixa | O evento depende de condições incomuns, acesso muito específico ou grande capacidade técnica |
| 2 | Média-baixa | O evento é possível, mas depende de vulnerabilidade ou condição específica |
| 3 | Média-alta | O evento é plausível e pode ocorrer em situações comuns de uso ou ataque |
| 4 | Alta | O evento pode ocorrer com facilidade, frequência ou durante condições previsíveis do sistema |

Na atribuição da probabilidade foram considerados o tipo de acesso necessário, a exposição da funcionalidade, a frequência de uso, a possibilidade de abuso interno, a previsibilidade do momento do ataque e a necessidade de existir uma vulnerabilidade específica.

### 2.2 Critérios de impacto

| Valor | Classificação | Critério |
|---:|---|---|
| 1 | Baixo | Causa pequeno transtorno e pode ser corrigido rapidamente |
| 2 | Moderado | Causa interrupção ou inconsistência limitada, com possibilidade de recuperação |
| 3 | Alto | Causa prejuízo relevante aos usuários, à administração, à privacidade ou à reputação |
| 4 | Muito alto | Pode comprometer operações críticas, afetar vários participantes ou causar prejuízo grave |

O impacto considera exposição de dados, prejuízo aos fornecedores e à Administração Pública, interrupção do serviço, perdas financeiras, danos à reputação e dificuldade de recuperação.

### 2.3 Cálculo e classificação

A pontuação é calculada pela expressão:

`Pontuação = Probabilidade × Impacto`

| Pontuação | Nível do risco |
|---:|---|
| 1 a 3 | Baixo |
| 4 a 7 | Médio |
| 8 a 11 | Alto |
| 12 a 16 | Crítico |

## 3. Registro de riscos

| ID | Origem STRIDE e caso de abuso | Evento de risco | Vulnerabilidade ou condição | P | I | Pontuação | Nível |
|---|---|---|---|---:|---:|---:|---|
| R-01 | T-12, T-19; CA-01 | Proposta comercial é acessada antes do encerramento do prazo | Regra temporal falha, autorização excessiva ou acesso direto ao arquivo | 2 | 4 | 8 | Alto |
| R-02 | T-04, T-20; CA-02 | Proposta de um fornecedor é alterada por outro usuário | Falha de autorização por objeto e ausência de confirmação de titularidade | 2 | 4 | 8 | Alto |
| R-03 | T-01, T-09; CA-03 | Atacante envia, altera ou retira proposta em nome de outra empresa | Conta ou sessão comprometida e ausência de confirmação reforçada | 3 | 4 | 12 | Crítico |
| R-04 | T-01, T-02, T-15; CA-04 | Credenciais de fornecedor ou agente público são comprometidas e usadas para acesso indevido | Senhas fracas ou reutilizadas, tentativa automatizada, phishing, sessão exposta ou vazamento em logs | 3 | 4 | 12 | Crítico |
| R-05 | T-05, T-19, T-20; CA-05 | Usuário obtém ou exerce privilégios superiores e modifica regras, prazos ou funções restritas | Autorização somente na interface, controle de acesso baseado em papéis (RBAC) incorreto, privilégio excessivo ou ausência de segregação de funções | 3 | 4 | 12 | Crítico |
| R-06 | T-06, T-17; CA-06 | Propostas, editais ou documentos são excluídos, corrompidos ou tornam-se indisponíveis | Exclusão definitiva, acesso indevido ao armazenamento, ausência de versionamento ou recuperação insuficiente | 2 | 4 | 8 | Alto |
| R-07 | T-07, T-10, T-20; CA-07 | Resultado, vencedor ou justificativa é alterado indevidamente | Acesso privilegiado indevido, decisão sem dupla aprovação e histórico alterável | 2 | 4 | 8 | Alto |
| R-08 | T-03, T-06; CA-08 | Empresa participa ou é habilitada com cadastro ou documento falso | Verificação insuficiente da empresa, representação ou autenticidade documental | 2 | 3 | 6 | Médio |
| R-09 | T-13, T-14, T-20; CA-09 | Dados cadastrais, bancários ou documentos de outra empresa são expostos | Falha de autorização por objeto, resposta excessiva da API ou arquivo com endereço previsível | 3 | 3 | 9 | Alto |
| R-10 | T-08, T-09, T-10, T-11; CA-10 | Logs são alterados, apagados ou deixam de registrar ação relevante | Privilégios excessivos, armazenamento alterável e ausência de cópia independente | 2 | 4 | 8 | Alto |
| R-11 | T-16, T-17, T-18; CA-11 | Licita+ fica indisponível ou degradado próximo ao prazo final | Volume excessivo, capacidade insuficiente, ausência de limitação e dependência de componentes únicos | 4 | 4 | 16 | Crítico |
| R-12 | T-06, T-17, T-21; CA-12 | Arquivo enviado compromete o servidor ou o ambiente de análise | Validação apenas pela extensão, processamento inseguro e abertura sem isolamento | 2 | 4 | 8 | Alto |

### 3.1 Cobertura das ameaças da Etapa 1

| Ameaças | Riscos que fornecem cobertura |
|---|---|
| T-01 | R-03 e R-04 |
| T-02 | R-04 |
| T-03 | R-08 |
| T-04 | R-02 |
| T-05 | R-05 |
| T-06 | R-06, R-08 e R-12 |
| T-07 | R-07 |
| T-08 | R-10 |
| T-09 | R-03 e R-10 |
| T-10 | R-07 e R-10 |
| T-11 | R-10 |
| T-12 | R-01 |
| T-13 e T-14 | R-09 |
| T-15 | R-04 |
| T-16 | R-11 |
| T-17 | R-06, R-11 e R-12 |
| T-18 | R-11 |
| T-19 | R-01 e R-05 |
| T-20 | R-02, R-05, R-07 e R-09 |
| T-21 | R-12 |

## 4. Justificativas das avaliações

### R-01 — Acesso antecipado a proposta

**Probabilidade 2:** o abuso é possível, mas depende de erro na regra temporal, falha de autorização ou privilégio interno específico. A proposta não deveria estar disponível por um fluxo normal antes do prazo.

**Impacto 4:** a revelação do valor de uma proposta pode favorecer concorrente, romper a isonomia e levar à contestação ou anulação da licitação. São afetados AT-03 e AT-09, além das funções UC-06, UC-08 e UC-09.

**Adequação do nível:** a combinação 2 × 4 resulta em 8, nível alto, pois uma condição específica é necessária, mas a consequência é muito grave.

### R-02 — Alteração de proposta de outra empresa

**Probabilidade 2:** requer falha de autorização por objeto, manipulação de identificador ou acesso privilegiado indevido. A exploração não deveria ocorrer no uso normal.

**Impacto 4:** pode modificar valor, documento ou estado da proposta, prejudicar diretamente um fornecedor e comprometer o resultado. Afeta AT-03, AT-04 e AT-09.

**Adequação do nível:** a pontuação 8 representa risco alto devido à gravidade da adulteração, mesmo com probabilidade média-baixa.

### R-03 — Operações em nome de outra empresa

**Probabilidade 3:** comprometimento de contas e sessões é plausível em sistemas web, especialmente quando não há autenticação reforçada ou confirmação de operações críticas.

**Impacto 4:** o atacante pode enviar, alterar ou retirar propostas em nome da vítima, causando fraude, desclassificação e disputa sobre autoria. Afeta AT-01, AT-03 e AT-04.

**Adequação do nível:** a pontuação 12 é crítica porque o evento combina possibilidade plausível com consequência direta sobre a participação na licitação.

### R-04 — Comprometimento de credenciais

**Probabilidade 3:** fornecedores, servidores, comissão e administradores utilizam o login com frequência, tornando phishing, reutilização de senha, tentativa automatizada e furto de sessão cenários plausíveis.

**Impacto 4:** a conta comprometida permite todas as ações atribuídas ao perfil da vítima. Contas privilegiadas podem expor propostas, alterar resultado ou afetar auditoria. Os principais ativos são AT-01 e AT-09, com possível propagação aos demais.

**Adequação do nível:** a pontuação 12 é crítica porque a identidade comprometida funciona como porta de entrada para diversos outros riscos.

### R-05 — Elevação ou abuso de privilégios

**Probabilidade 3:** chamadas diretas à API e erros de RBAC são plausíveis quando a autorização não é aplicada de modo centralizado em todas as operações.

**Impacto 4:** o agente pode acessar propostas, alterar prazo, resultado ou permissões e destruir evidências. AT-09 é o ativo principal, com alcance potencial sobre AT-03, AT-04, AT-07 e AT-08.

**Adequação do nível:** a pontuação 12 é crítica e seu tratamento é prioritário porque o controle de autorização protege vários fluxos simultaneamente.

### R-06 — Exclusão ou indisponibilidade de documentos e propostas

**Probabilidade 2:** o evento depende de acesso ao armazenamento, falha de autorização ou erro operacional sem mecanismo de recuperação.

**Impacto 4:** a perda de propostas, habilitações ou editais pode desclassificar participantes, interromper a análise e exigir repetição do processo. Afeta AT-03, AT-06 e AT-07.

**Adequação do nível:** a pontuação 8 é alta pela dificuldade de reconstruir evidências e garantir a validade do processo.

### R-07 — Modificação do resultado

**Probabilidade 2:** a operação exige perfil da comissão ou outro acesso privilegiado, mas pode ocorrer se houver conta comprometida ou ausência de segregação de funções.

**Impacto 4:** a alteração do vencedor ou da justificativa constitui fraude direta, pode produzir prejuízo financeiro e levar à anulação da licitação. Afeta AT-04, AT-08 e AT-09.

**Adequação do nível:** a pontuação 8 é alta; na priorização, o risco recebe precedência sobre outros riscos de mesma faixa por seus efeitos jurídicos e administrativos.

### R-08 — Cadastro ou documentação falsa

**Probabilidade 2:** depende de fornecedor mal-intencionado e de validação insuficiente da identidade, representação ou documentação.

**Impacto 3:** pode permitir participação ou habilitação irregular, mas a análise da comissão ainda pode identificar a fraude antes da decisão final. Afeta AT-02 e AT-06.

**Adequação do nível:** a pontuação 6 é média, pois existem etapas posteriores capazes de detectar o problema, embora o evento permaneça relevante.

### R-09 — Exposição de dados de outras empresas

**Probabilidade 3:** consultas por identificadores, APIs e downloads são frequentes; uma falha de autorização por objeto ou retorno excessivo torna o abuso plausível.

**Impacto 3:** cadastro, dados bancários e documentos podem causar fraude, violação de privacidade e dano reputacional. Afeta AT-02, AT-05, AT-06 e AT-09.

**Adequação do nível:** a pontuação 9 é alta devido à combinação entre superfície frequente e prejuízo relevante.

### R-10 — Alteração ou destruição de logs

**Probabilidade 2:** exige privilégio elevado ou comprometimento da infraestrutura de auditoria, condição mais específica do que um acesso comum.

**Impacto 4:** sem logs íntegros, ações podem ser negadas, incidentes não podem ser reconstruídos e responsáveis não podem ser identificados. O ativo diretamente afetado é AT-04.

**Adequação do nível:** a pontuação 8 é alta porque a perda da auditoria agrava quase todos os demais incidentes.

### R-11 — Indisponibilidade no prazo final

**Probabilidade 4:** o encerramento de uma licitação é previsível e concentra acessos legítimos. Esse momento também pode ser escolhido deliberadamente para sobrecarga.

**Impacto 4:** fornecedores podem perder o prazo, a participação deixa de ser isonômica e o processo pode ser interrompido ou contestado. Afeta AT-03, AT-06, AT-07 e AT-08.

**Adequação do nível:** a pontuação máxima, 16, torna o risco crítico e o primeiro da ordem de prioridade.

### R-12 — Arquivo malicioso

**Probabilidade 2:** o envio de arquivos é frequente, mas o comprometimento depende de conteúdo malicioso e falha específica no processamento ou na abertura.

**Impacto 4:** o evento pode comprometer servidor ou estação da comissão, ampliar privilégios, alterar dados ou causar indisponibilidade. Afeta AT-03, AT-06, AT-07 e AT-09.

**Adequação do nível:** a pontuação 8 é alta, pois a probabilidade é condicionada, mas o impacto potencial é muito alto.

## 5. Priorização dos riscos

| Prioridade | Risco | Pontuação | Justificativa da posição |
|---:|---|---:|---|
| 1 | R-11 — Indisponibilidade no prazo final | 16 | Maior pontuação, momento previsível de ataque e possibilidade de impedir vários fornecedores de participar |
| 2 | R-05 — Elevação ou abuso de privilégios | 12 | O controle de autorização é dependência para proteger propostas, prazos, resultados e logs |
| 3 | R-04 — Comprometimento de credenciais | 12 | Pode iniciar vários outros eventos e alcançar contas com poderes diferentes |
| 4 | R-03 — Operações em nome de outra empresa | 12 | Produz fraude diretamente na submissão, alteração ou retirada de proposta |
| 5 | R-07 — Modificação do resultado | 8 | Apesar da pontuação menor, possui consequência jurídica e administrativa direta e recuperação complexa |
| 6 | R-09 — Exposição de dados de empresas | 9 | Tem superfície frequente e pode afetar vários participantes, dados bancários e documentos |
| 7 | R-01 — Acesso antecipado a proposta | 8 | A quebra de sigilo destrói a isonomia mesmo que nenhuma informação seja posteriormente alterada |
| 8 | R-02 — Alteração de proposta alheia | 8 | Afeta diretamente a integridade da disputa, mas depende de falha de autorização específica |
| 9 | R-10 — Alteração ou destruição de logs | 8 | Aumenta o impacto de outros riscos e impede investigação e responsabilização |
| 10 | R-06 — Exclusão ou indisponibilidade de dados | 8 | Possui impacto alto, mas recuperação pode ser viável se versionamento e cópias estiverem disponíveis |
| 11 | R-12 — Arquivo malicioso | 8 | Exige falha específica de processamento, mas pode comprometer componentes internos |
| 12 | R-08 — Cadastro ou documentação falsa | 6 | A comissão e verificações cadastrais constituem oportunidades adicionais de detecção |

R-07 foi colocado antes de R-09 apesar da pontuação numérica menor. A justificativa é que uma alteração confirmada do vencedor pode produzir efeito administrativo imediato, prejuízo financeiro e anulação do processo. A ordem deve ser revisada quando existirem métricas e evidências reais.

## 6. Estratégias de tratamento

| Risco | Estratégia principal | Justificativa |
|---|---|---|
| R-01 | Reduzir | O sigilo das propostas é função essencial e não pode ser evitado ou conscientemente aceito sem proteção |
| R-02 | Reduzir | O envio e a alteração de propostas são necessários, mas podem receber autorização por objeto e versionamento |
| R-03 | Reduzir | A participação remota exige contas; autenticação reforçada reduz a probabilidade de fraude |
| R-04 | Reduzir | O acesso por credenciais é indispensável e deve ser protegido em todos os perfis |
| R-05 | Reduzir | Perfis distintos são necessários; menor privilégio e segregação reduzem o abuso |
| R-06 | Reduzir | Documentos e propostas precisam permanecer disponíveis e recuperáveis |
| R-07 | Reduzir | A definição do vencedor é indispensável e requer aprovação e evidências verificáveis |
| R-08 | Reduzir | O cadastro de fornecedores é necessário e pode ser submetido a validação |
| R-09 | Reduzir | O tratamento de dados é necessário, mas deve ser limitado ao perfil e à finalidade |
| R-10 | Reduzir | A auditoria é obrigatória para rastreabilidade e não pode ser removida do escopo |
| R-11 | Reduzir | O serviço precisa estar disponível nos prazos; capacidade e proteção externa podem diminuir a probabilidade e o impacto |
| R-12 | Reduzir | O upload é requisito do processo, mas conteúdo e processamento podem ser controlados |

Foi decidido pelo grupo que a estratégia a ser seguida é de reduzir os riscos identificados. Evitar algum risco poderia ocasionar na remoção de funções essenciais, como envio de propostas e documentos. Nenhum risco foi proposto para aceitação sem tratamento porque todos atingem ativos ou operações relevantes.

## 7. Funções do NIST Cybersecurity Framework 2.0

| Função | Aplicação no Licita+ |
|---|---|
| **Govern** | Definir políticas, responsáveis, critérios de risco, segregação de funções e regras de aceitação residual |
| **Identify** | Manter ativos, fluxos, dependências, vulnerabilidades, fornecedores e riscos conhecidos |
| **Protect** | Aplicar autenticação, autorização, proteção de dados, validação de arquivos e mecanismos de continuidade |
| **Detect** | Monitorar autenticações, alterações, acessos a propostas, falhas, sobrecarga e integridade dos logs |
| **Respond** | Conter contas, sessões, arquivos e operações suspeitas; investigar e comunicar incidentes |
| **Recover** | Restaurar documentos e serviço, reverter alterações e validar a retomada segura do processo |

## 8. Mapeamento dos riscos para o NIST CSF 2.0

| Risco | Govern | Identify | Protect | Detect | Respond | Recover |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| R-01 | X |  | X | X | X |  |
| R-02 | X |  | X | X | X | X |
| R-03 | X |  | X | X | X | X |
| R-04 | X | X | X | X | X |  |
| R-05 | X | X | X | X | X | X |
| R-06 |  | X | X | X | X | X |
| R-07 | X |  | X | X | X | X |
| R-08 | X | X | X | X | X |  |
| R-09 | X | X | X | X | X |  |
| R-10 | X |  | X | X | X | X |
| R-11 | X | X | X | X | X | X |
| R-12 |  | X | X | X | X | X |

## 9. Plano de tratamento

| Risco | Estratégia | Controles propostos | Funções NIST | Responsáveis | Evidências e verificação |
|---|---|---|---|---|---|
| R-01 | Reduzir | Aplicar autorização no servidor combinando perfil e encerramento do prazo; manter propostas criptografadas antes da abertura; negar acesso direto ao arquivo | Govern, Protect, Detect, Respond | Desenvolvimento backend, Segurança e Comissão | Testes antes/depois do prazo; testes com perfis indevidos; logs de tentativas; revisão da regra de abertura |
| R-02 | Reduzir | Verificar titularidade da proposta em cada operação; usar autorização por objeto; manter histórico de versões e resumo criptográfico do conteúdo | Govern, Protect, Detect, Respond, Recover | Desenvolvimento backend e Segurança | Testes de troca de identificador; tentativa cruzada entre empresas; comparação de versões e hashes; teste de restauração |
| R-03 | Reduzir | Exigir autenticação multifator (MFA); solicitar nova autenticação para alterar ou retirar proposta; notificar operações críticas; permitir revogação de sessões | Govern, Protect, Detect, Respond, Recover | Identidade e Acesso, Desenvolvimento e Suporte | Testes com segundo fator ausente; teste de sessão revogada; registro e recebimento de notificações; simulação de conta comprometida |
| R-04 | Reduzir | Exigir MFA, especialmente para agentes públicos; armazenar senhas com Argon2id ou bcrypt e salt exclusivo; limitar tentativas; detectar novos dispositivos e evitar credenciais em logs | Govern, Identify, Protect, Detect, Respond | Identidade e Acesso, Desenvolvimento, Segurança e Operações | Revisão de configuração; testes de força bruta e bloqueio; inspeção de logs; alertas de login anômalo; teste de encerramento de sessões |
| R-05 | Reduzir | Centralizar RBAC no servidor; adotar negação por padrão e menor privilégio; segregar administração, comissão e publicação; exigir dupla aprovação para mudança de papel ou prazo | Govern, Identify, Protect, Detect, Respond, Recover | Arquitetura, Desenvolvimento, Segurança e Gestor do sistema | Matriz de acesso aprovada; testes por perfil em cada endpoint; revisão periódica de permissões; logs de aprovação; teste de reversão |
| R-06 | Reduzir | Usar exclusão lógica; versionar objetos; aplicar cópias de segurança protegidas; verificar integridade; testar restauração de propostas e documentos | Identify, Protect, Detect, Respond, Recover | Banco de Dados, Infraestrutura e Desenvolvimento | Relatórios de backup; teste documentado de restauração; alertas de exclusão; comparação de integridade; medição de tempo de recuperação |
| R-07 | Reduzir | Exigir dupla aprovação para resultado; assinar ou selar a versão publicada; versionar decisão e justificativa; bloquear edição silenciosa após publicação | Govern, Protect, Detect, Respond, Recover | Comissão, Desenvolvimento, Segurança e Autoridade competente | Teste de publicação sem segunda aprovação; validação de assinatura/selo; histórico de versões; simulação de reversão |
| R-08 | Reduzir | Validar empresa e representante em fonte autorizada ou por conferência formal; verificar assinatura e validade documental quando disponíveis; registrar decisão da comissão | Govern, Identify, Protect, Detect, Respond | Cadastro, Comissão e Segurança | Amostra de cadastros conferidos; teste com documento inválido ou vencido; registro da fonte e da decisão; relatório de divergências |
| R-09 | Reduzir | Aplicar autorização por objeto; minimizar campos retornados; usar identificadores não previsíveis como defesa adicional; cifrar dados armazenados; registrar downloads | Govern, Identify, Protect, Detect, Respond | Desenvolvimento, Banco de Dados, Privacidade e Segurança | Testes entre empresas; revisão das respostas da API; inspeção das permissões do armazenamento; registros de download; teste de exposição de campos |
| R-10 | Reduzir | Enviar logs a armazenamento separado e de acréscimo; restringir escrita a identidades de serviço; encadear ou assinar registros; alertar interrupções e alterações | Govern, Protect, Detect, Respond, Recover | Segurança, Infraestrutura, Auditoria e Desenvolvimento | Teste de tentativa de alteração; validação de assinatura/encadeamento; alerta por ausência de eventos; comparação com cópia independente |
| R-11 | Reduzir | Limitar requisições por origem e conta; usar proteção contra negação de serviço distribuída (DDoS); dimensionar capacidade; monitorar saturação; enfileirar submissões com protocolo de recebimento; definir plano de contingência para prazo | Govern, Identify, Protect, Detect, Respond, Recover | Infraestrutura, Operações, Desenvolvimento e Gestor da licitação | Testes de carga; métricas de latência e erro; alertas de saturação; teste da fila e do recibo; exercício do plano de contingência |
| R-12 | Reduzir | Permitir somente formatos e tamanhos necessários; validar extensão, MIME e conteúdo; renomear arquivos; armazenar fora da área pública; verificar malware; processar e visualizar em ambiente isolado | Identify, Protect, Detect, Respond, Recover | Desenvolvimento, Segurança, Infraestrutura e Comissão | Testes com tipo divergente, tamanho excessivo e arquivo de teste seguro; registro da análise; verificação do isolamento; teste de remoção e recuperação |

## 10. Ordem inicial de implementação

A implementação deverá ocorrer por dependências, e não apenas pela ordem numérica dos riscos.

### Fase 1 — Governança e fundamentos de acesso

1. aprovar responsáveis, política de risco, classificação dos ativos e critérios de aceitação residual;
2. definir matriz de papéis, menor privilégio e segregação de funções;
3. centralizar autenticação e autorização no servidor.

**Riscos atendidos prioritariamente:** R-03, R-04 e R-05.
**Justificativa:** identidade e autorização são dependências para quase todos os fluxos seguintes.

### Fase 2 — Resiliência e auditoria

1. implantar trilha de auditoria separada e resistente à alteração;
2. configurar monitoramento, alertas e resposta inicial;
3. executar testes de carga e implantar proteção contra sobrecarga;
4. estabelecer cópias, versionamento e restauração.

**Riscos atendidos prioritariamente:** R-10, R-11 e R-06.
**Justificativa:** R-11 possui a maior pontuação, enquanto logs e recuperação fornecem evidências e capacidade de resposta para os demais riscos.

### Fase 3 — Proteção do ciclo da proposta e do resultado

1. implementar autorização por objeto e validação temporal;
2. proteger o sigilo e a integridade das propostas;
3. exigir confirmação reforçada para operações críticas;
4. implantar dupla aprovação e versionamento do resultado.

**Riscos atendidos prioritariamente:** R-01, R-02, R-03 e R-07.
**Justificativa:** os controles dependem do serviço de identidade, do RBAC e da auditoria definidos nas fases anteriores.

### Fase 4 — Dados empresariais e arquivos

1. restringir dados cadastrais, bancários e documentos por empresa;
2. minimizar respostas e registrar downloads;
3. validar cadastro e autenticidade documental;
4. implementar processamento seguro e isolado de uploads.

**Riscos atendidos prioritariamente:** R-08, R-09 e R-12.
**Justificativa:** completa a proteção dos fluxos de cadastro, consulta e análise de documentos.

### Fase 5 — Validação integrada

1. executar testes de segurança por perfil e por objeto;
2. realizar testes de carga, restauração e resposta a incidentes;
3. coletar evidências, corrigir falhas e reavaliar os riscos;
4. submeter riscos residuais à aprovação formal.

## 11. Estimativa do risco residual

| Risco | Nível inicial | P residual | I residual | Pontuação residual | Nível residual esperado | Condição para aceitar o residual |
|---|---|---:|---:|---:|---|---|
| R-01 | Alto (8) | 1 | 4 | 4 | Médio | Regra temporal e autorização aprovadas em testes; tentativas indevidas monitoradas |
| R-02 | Alto (8) | 1 | 4 | 4 | Médio | Testes por objeto sem acesso cruzado; versões e restauração verificadas |
| R-03 | Crítico (12) | 1 | 4 | 4 | Médio | MFA e reautenticação obrigatórios; sessões revogáveis; alertas validados |
| R-04 | Crítico (12) | 1 | 4 | 4 | Médio | MFA, limitação de tentativas e monitoramento testados em todos os perfis críticos |
| R-05 | Crítico (12) | 1 | 4 | 4 | Médio | Matriz de acesso aprovada; endpoints negam funções fora do perfil; revisão periódica ativa |
| R-06 | Alto (8) | 1 | 4 | 4 | Médio | Versionamento, integridade, backup e restauração testados dentro do tempo definido |
| R-07 | Alto (8) | 1 | 4 | 4 | Médio | Dupla aprovação e histórico inviolável validados; procedimento de reversão testado |
| R-08 | Médio (6) | 1 | 3 | 3 | Baixo | Validação cadastral/documental registrada e amostras revisadas pela comissão |
| R-09 | Alto (9) | 2 | 3 | 6 | Médio | Testes de autorização e minimização aprovados; downloads monitorados e revisados |
| R-10 | Alto (8) | 1 | 4 | 4 | Médio | Armazenamento separado, alertas e verificação de integridade funcionando |
| R-11 | Crítico (16) | 2 | 4 | 8 | Alto | Testes de carga atendem ao limite definido; proteção externa e contingência exercitadas |
| R-12 | Alto (8) | 1 | 4 | 4 | Médio | Tipos permitidos, inspeção e isolamento testados; resposta a arquivo suspeito exercitada |

É importante reforçar, conforme orientado no enunciado do projeto, que os níveis residuais são apenas estimativas e não resultados confirmados. O impacto permanece alto ou muito alto em vários riscos porque, se o evento ainda ocorrer, a licitação pode continuar sendo seriamente impactada. A redução estimada decorre principalmente da diminuição da probabilidade. 

R-11 permanece alto mesmo após os controles porque nenhuma solução garante disponibilidade absoluta diante de ataques volumétricos, falhas externas ou picos imprevistos.

## 12. Considerações finais

Os riscos prioritários são R-11, relacionado à indisponibilidade no prazo final; R-05, referente à elevação ou ao abuso de privilégios; R-04, referente ao comprometimento de credenciais; e R-03, relativo à realização de operações em nome de outra empresa. Eles receberam prioridade devido à alta pontuação, à possibilidade de iniciar outros incidentes e ao potencial de comprometer a participação dos fornecedores e a legitimidade da licitação.

Como mencionado anteriormente, a estratégia adotada foi reduzir os riscos, pois as funcionalidades envolvidas são essenciais ao Licita+ e não podem ser simplesmente eliminadas. 

Os controles considerados essenciais são autenticação multifator, autorização centralizada no servidor, menor privilégio, segregação de funções, autorização por objeto, proteção temporal das propostas, auditoria resistente à alteração, versionamento, proteção contra sobrecarga e tratamento seguro de arquivos.

As principais dificuldades foram agrupar as ameaças relacionadas sem perder rastreabilidade, estimar probabilidade para um sistema que o grupo não possui total conhecimento e, consequentemente, priorizar os riscos. A avaliação é limitada pois o sistema não foi implementado.
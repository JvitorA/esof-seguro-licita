# Etapa 6 - Monitoramento e Detecção de Intrusões

## Sistema de Licitações Eletrônicas - Licita+

## 1. Conceito de detecção de intrusões

Detecção de intrusões é o processo de observar eventos da aplicação, da infraestrutura e dos usuários para identificar atividades que possam indicar acesso não autorizado, abuso de privilégio, fraude ou indisponibilidade. No Licita+, os registros devem permitir relacionar uma operação a uma identidade, uma sessão, uma origem, uma data e um resultado.

A detecção não substitui os controles preventivos. Ela fornece uma segunda linha de defesa e ajuda a identificar incidentes que atravessaram ou contornaram as proteções.

## 2. Diferenca entre prevenir e detectar

| Aspecto | Prevencao | Deteccao |
|---|---|---|
| Objetivo | Impedir que o comportamento malicioso seja executado | Reconhecer que um comportamento suspeito aconteceu ou esta acontecendo |
| Exemplos no Licita+ | MFA, autorizacao no servidor, limitação de taxa, negação por padrão e fila de propostas | Alertas para falhas repetidas de login, recusas de acesso e rajadas de requisicoes |
| Resultado esperado | Bloqueia ou limita a tentativa | Gera evidencias, alerta a equipe e inicia a resposta |
| Limite | Um ataque pode explorar uma falha ainda desconhecida ou tentar um controle por outros meios | Um alerta pode ser falso positivo e precisa ser triado |

Mecanismos preventivos devem produzir seus proprios eventos. Por exemplo, um bloqueio de taxa deve ser registrado mesmo que tenha impedido a requisicao.

## 3. Eventos que devem ser registrados

Os registros devem ser escritos em formato estruturado e preservados em armazenamento separado da aplicacao. A cadeia de auditoria do prototipo ja registra usuario, acao, resultado, detalhe e timestamp; em ambiente real, essas entradas devem ser complementadas por identificador da sessao, origem, identificador da licitacao e correlacao de requisicoes.

| Categoria | Eventos obrigatorios | Informacoes relevantes |
|---|---|---|
| Autenticacao | Login valido, login recusado, MFA ausente ou invalido, bloqueio temporario, logout e revogacao | Usuario, origem, sessao, timestamp e motivo |
| Autorizacao | Requisicao permitida, negada ou registrada como acesso indevido a recurso | Usuario, papel, operacao, objeto, licitacao e status HTTP |
| Operacoes de negocio | Criação, alteração e retirada de proposta; definição de resultado; acesso a dados cadastrais | Empresa, licitação, proposta, usuário, ação e resultado |
| Disponibilidade | Limite excedido, erros, latencia elevada, fila cheia e reenvio idempotente | Origem, endpoint, quantidade, janela e identificador da requisicao |
| Integridade e auditoria | Alteracao ou falha de leitura dos registros; operacoes administrativas sobre os logs | Identidade administrativa, acao, resultado e integridade da cadeia |

Os logs nao devem conter senhas, codigos MFA, tokens de sessao completos nem documentos e dados bancarios.

## 4. Regras simples de deteccao

### Regra 1 - Tentativas repetidas de login

| Campo | Descricao |
|---|---|
| Risco observado | R-04 - Comprometimento de credenciais; CA-04 - Roubar credenciais e abuso de contas |
| Fonte de dados | Logs de autenticacao do prototipo, com eventos de login, resultado `FALHA` ou `BLOQUEADO` e usuario informado |
| Condicao de alerta | Cinco ou mais falhas de senha ou MFA para a mesma conta em dez minutos, ou tres contas diferentes sendo atacadas pela mesma origem em dez minutos |
| Resposta inicial | O sistema deve bloquear ou atrasar novas tentativas, alertar o administrador de segurança e registrar o incidente. A conta deve ser investigada antes de uma nova liberacao; em caso confirmado, a sessao deve ser revogada e o fluxo de recuperacao iniciado |

O prototipo ja aplica bloqueio progressivo e registro das falhas. Esta regra transforma esses eventos em um alerta central.

### Regra 2 - Rejeicoes repetidas de autorizacao

| Campo | Descricao |
|---|---|
| Risco observado | R-05 - Elevacao ou abuso de privilegios; CA-02 - alterar proposta alheia, CA-05 - elevar privilegios e CA-09 - acessar dados de outra empresa |
| Fonte de dados | Logs da API com usuario autenticado, operacao solicitada, objeto, licitacao, papel e resultado HTTP 403 |
| Condicao de alerta | Dez recusas 403 pela mesma conta em cinco minutos, ou cinco recusas envolvendo recursos ou empresas diferentes no mesmo intervalo |
| Resposta inicial | Gerar alerta prioritario, incluir a origem e os recursos tentados no ticket e suspender temporariamente as operacoes protegidas da conta suspeita. Se houver indicio de conta comprometida, revogar suas sessoes e revisar os logs anteriores |

No prototipo, cada negacao por autorizacao central resulta em evento `403`. Isso permite distinguir uma tentativa de acesso indevido de uma operacao legima.

### Regra 3 - Rajada de requisicoes com limite excedido

| Campo | Descricao |
|---|---|
| Risco observado | R-11 - Licita+ indisponivel no prazo final; CA-11 - sobrecarregar o sistema |
| Fonte de dados | Logs da protecao de borda, API Gateway e limitacao de taxa, incluindo origem, endpoint, timestamp e respostas 429 |
| Condicao de alerta | Mais de 20 respostas 429 para uma mesma origem em dez segundos, ou crescimento repentino superior a duas vezes o pico normal em uma janela de cinco minutos |
| Resposta inicial | Confirmar se a origem pertence a escanner, fornecedor ou automacao legitima. Em caso suspeito, aplicar limite mais rigoroso ou bloqueio temporario no gateway, preservar o incidente e comunicar o canal de capacidade antes do prazo critico |

O prototipo demonstra a resposta controlada 429 sem a infraestrutura real de gateway. Em producao, o alerta deve combinar a taxa por origem com a carga de CPU, fila e banco.

## 5. O que deve acontecer depois de um alerta

1. **Validacao:** a equipe confirma se o alerta corresponde a um incidente real, a um falso positivo ou a uma falha de monitoramento.
2. **Correlacao:** os eventos de autenticacao, autorizacao, negocio, taxa e auditoria sao agrupados por conta, origem, sessao e periodo.
3. **Contencao:** dependendo da gravidade, o sistema bloqueia temporariamente novas tentativas, revoga sessoes, restringe a origem ou ativa protecao adicional no gateway.
4. **Preservacao de evidencias:** os logs do incidente são protegidos contra alteracao e relacionados a um identificador unico de ocorrencia.
5. **Escalonamento:** incidentes envolvendo contas privilegiadas, propostas sigilosas, resultado ou integridade dos logs devem ser reportados imediatamente ao responsavel de seguranca e a autoridade organizacional competente.
6. **Recuperacao:** sessoes e credenciais comprometidas sao substituidas, dados ou configuracoes afetados são restaurados a partir de uma copia confiavel e os controles sao revisados.
7. **Licoes aprendidas:** a origem do incidente, a causa raiz, o tempo de resposta e a eficacia da regra devem ser documentados. Ajustes de limite ou novas regras sao incorporados sem retirar os registros ou permitir bypass.

Um alerta isolado não deve apagar evidencias nem confirmar culpa automaticamente. Decisoes disciplinares ou administrativas dependem da investigacao e das responsabilidades correspondentes.

## 6. Rastreabilidade com as etapas anteriores

| Entrega anterior | Relacao com a deteccao |
|---|---|
| Etapa 1 - Casos de abuso | As regras cobrem CA-04, CA-02, CA-05, CA-09 e CA-11 |
| Etapa 2 - Riscos NIST | R-04, R-05 e R-11 são os riscos prioritarios observados pelas regras |
| Etapa 3 - Arquitetura segura | Os componentes IAM, autorizacao central, API Gateway, auditoria e proteção de borda são as fontes dos eventos |
| Etapa 4 - Codigo seguro | MFA, bloqueio progressivo, negação por padrão, recibo idempotente e limitacao de requisicoes já produziriam os eventos necessários |
| Etapa 5 - Verificacao | Os achados que indicarem falha de autenticacao, acesso ou disponibilidade podem ser convertidos em casos de teste para confirmar a geração e o alerta |

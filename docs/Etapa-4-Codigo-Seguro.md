# Etapa 4 — Código Seguro e Testes de Segurança

**Sistema de Licitações Eletrônicas — Licita+**

O grupo optou por descrever duas práticas de código seguro no Licita + que estão fortemente ligadas aos riscos e requisitos de segurança apresentados na Etapa 3. As práticas são: **validação de entrada no envio de propostas** e **controle de autorização na publicação de editais**. Cada prática apresenta dois testes de aceitação antes da descrição da solução. 

## 1. Validação de entrada no envio de propostas

**Risco e requisito:** R-11 (indisponibilidade no prazo final), RS-01 e DA-01 da Etapa 3. Limitar o tamanho da entrada antes de encaminhá-la à fila de submissões reduz o consumo excessivo de recursos por requisição. A verificação do formato e do conteúdo dos anexos também auxilia o tratamento do R-12 (arquivo malicioso), da Etapa 2. É importante reforçar que esta ação controla somente o recebimento de propostas; não substituindo a limitação de taxa, a proteção contra DDoS nem o teste de carga previsto no RS-01.

**Caso de uso e ativo:** UC-06 (envio de proposta) e AT-03 (propostas comerciais). O ponto de aplicação é o fluxo entre o API Gateway e a API do Licita+, antes da aceitação definitiva da proposta e do envio para a fila.

### 1.1 Testes de segurança definidos antes da implementação

**Premissas:** usar, em cada teste, um fornecedor autenticado e autorizado, uma licitação aberta e uma fila disponível. O edital de teste permite arquivos no formato PDF, com no máximo **10 MB por anexo**. O teto total da requisição de teste é maior que o volume enviado nos dois cenários, para que o segundo teste verifique o limite por arquivo, não o limite total. 

| Teste | Entrada ou ação | Resultado seguro esperado |
|---|---|---|
| **TS-01 — Entrada válida** | Enviar uma proposta com os campos obrigatórios válidos e um PDF com exatamente 10 MB. | A API aceita a submissão e devolve `202 Accepted` com um recibo somente após a aceitação. A verificação interna encontra uma submissão enfileirada e associada ao recibo. O anexo não fica publicamente acessível. |
| **TS-02 — Entrada inválida** | Repetir o teste anterior, anexando um PDF válido maior que 10 MB. | A API devolve `413` com mensagem indicando que o arquivo é muito grande. Assim, o recibo não é gerado e a proposta é recusada. |

### 1.2 Como a prática seria implementada

1. **Definir o contrato de entrada.** Especificar na API os campos obrigatórios, formatos aceitos, quantidade de anexos e limites por arquivo e por requisição. O teto total deve incluir o tamanho do formulário. Definir os formatos permitidos para o cenário a partir das regras do edital e da plataforma, sem deixar essa escolha ao navegador.
2. **Aplicar limites antes de processar a entrada completa.** Configurar o API Gateway para limitar o tamanho total do conteúdo da requisição e a API para contar os bytes recebidos de cada anexo durante a leitura. Se ultrapassar o limite estabelecido deve-se interromper imediatamente, sem carregar o arquivo inteiro na memória. O navegador pode sinalizar o limite para orientar o fornecedor.
3. **Validar os campos e os arquivos.** Verificar os tipos e validar os campos; por exemplo, exigir duas casas decimais para valores em real. Para o anexo, comparar a extensão permitida com o tipo detectado e a estrutura do arquivo por meio de biblioteca mantida e execução com recursos limitados. Tratar o nome e o MIME declarado pelo cliente como dados não confiáveis. A concordância entre formato e conteúdo não substitui a inspeção de segurança prevista no R-12.
4. **Rejeitar sem produzir efeitos definitivos.** Responder `413` quando um limite de tamanho for ultrapassado e `400` quando os campos ou o formato do anexo não atenderem ao contrato. Não persistir a proposta como aceita nem enviá-la para a fila. Registrar o código da recusa e o identificador da requisição, sem gravar o conteúdo da proposta ou do anexo nos logs.
5. **Encaminhar somente submissões aprovadas.** Depois de validar a entrada e confirmar a autorização, usar o horário do servidor no registro de aceitação para verificar se o prazo está aberto. Como trata-se de uma proposta, o anexo deve ser armazenado de forma privada, com identificador gerado pela aplicação. Gravar a submissão e sua entrada em uma fila persistente vinculadas ao mesmo identificador antes de devolver o recibo. Usar esse identificador no processamento para que a repetição de uma tarefa não crie outra submissão.

**Resultado esperado:** a proposta no limite permitido é aceita; a proposta que o ultrapassa é recusada antes do armazenamento definitivo e do enfileiramento, sem gerar recibo. Os dois testes apenas verificam o tamanho permitido de entrada, não a detecção de arquivos maliciosos.

**Fluxograma:** Para facilitar a compreensão da validação de entrada no envio de propostas, o fluxograma correspondente está disponível no diretório `diagramas/etapa-4`.

**Referências OWASP:** [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html), para validação de formato e regras de negócio no servidor; [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), para lista de formatos permitidos e limites de tamanho.

## 2. Controle de autorização na publicação de editais

**Risco e requisito:** R-05 (elevação ou abuso de privilégios), RS-02 e DA-02. A API deve decidir no servidor se a identidade autenticada pode publicar aquele edital, conforme o papel, a permissão, o vínculo com o órgão e o estado da licitação. Estar autenticado não concede autorização (**conforme vídeo Autorização vs Autenticação, do Codefólio**).

**Caso de uso e ativos:** UC-04 (publicação de licitação), relacionado ao CA-05 (elevação de privilégios). O controle protege AT-07 (editais, requisitos e prazos) e AT-09 (perfis e permissões), com evidência em AT-04 (logs de auditoria). Na arquitetura da Etapa 3, a API aplica a decisão do Serviço Central de Autorização antes de acionar o Módulo de Licitações e Propostas.

### 2.1 Testes de segurança definidos antes da implementação

**Premissas:** usar um edital fictício em rascunho, apto para publicação. Restaurar o rascunho entre os testes. Os dois usuários (user1 e user2) têm sessão válida e solicitam a mesma operação sobre o mesmo objeto; a diferença é a autorização para publicar.

| Teste | Entrada ou ação | Resultado seguro esperado |
|---|---|---|
| **TS-03 — Ação autorizada** | Um servidor público do órgão responsável (user1), com permissão de publicação, solicita a publicação do edital. | A API devolve `200 OK`. O edital passa de rascunho a publicado, fica disponível para consulta e gera evento de auditoria de publicação. |
| **TS-04 — Ação não autorizada** | Um fornecedor autenticado (user2), sem permissão de publicação, solicita a mesma operação pelo ambiente de teste da API. | A API devolve `403 Forbidden` e registra a recusa na auditoria. O edital continua em rascunho; não há publicação nem alteração do registro de negócio. |

### 2.2 Como a prática seria implementada

1. **Definir a política central.** Registrar a publicação como uma ação específica da matriz de acesso. Conceder a permissão apenas a servidor público autorizado do órgão responsável pelo edital. Exigir um edital em estado publicável. Não conceder a ação automaticamente a fornecedor, comissão ou administrador técnico. Se não houver regra de permissão aplicável, negar.
2. **Obter os atributos de fontes confiáveis.** Validar a sessão no Serviço de Identidade e Acesso. Obter no servidor a identidade, o papel, as permissões vigentes e o vínculo do usuário. Ler no banco de dados o órgão responsável e o estado atual do edital. Não usar papel, vínculo ou permissão declarados pelo cliente para decidir o acesso.
3. **Verificar cada requisição protegida.** A API envia à política central a identidade autenticada, a ação de publicar e os atributos do edital. Aplica a decisão mesmo quando a requisição não vem da interface web. Sem permissão, devolve `403` no cenário testado; se a decisão não puder ser obtida, não publica.
4. **Proteger a mudança de estado.** Após uma decisão favorável, executar a transição para publicado em uma gravação condicionada ao estado e ao órgão verificados. Se o edital mudar entre a verificação e a gravação, não publicar com a decisão antiga; reavaliar. Expor o edital na consulta somente depois de confirmada a mudança de estado.
5. **Auditar a decisão e o resultado.** Registrar no serviço de auditoria a identidade, a ação, o identificador do edital, a data e hora, a decisão e o resultado da operação. Não incluir credenciais ou conteúdo de propostas. A verificação compara a resposta da API, o estado persistido do edital e o evento de auditoria.

**Resultado esperado:** o servidor autorizado (user1) publica o edital; o fornecedor autenticado (user2) não consegue executar essa função. Os dois cenários verificam a separação de permissões no UC-04, sem substituir a matriz completa de autorização exigida por RS-02.

**Fluxograma:** Para facilitar a compreensão do controle de autorização na publicação de editais, o fluxograma correspondente está disponível no diretório `diagramas/etapa-4`.

**Referência OWASP:** [Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), para menor privilégio, negação por padrão e verificação de acesso a cada requisição e recurso.

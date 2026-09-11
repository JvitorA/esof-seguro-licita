# Casos de uso

Este documento reúne os casos de uso iniciais do sistema de licitações. Eles descrevem as principais interações esperadas entre os usuários e o sistema.

## Atores

- **Empresa/Fornecedor:** pessoa jurídica interessada em consultar licitações e enviar propostas.
- **Servidor Público:** responsável pelo cadastro e pela publicação das licitações.
- **Comissão de Licitação:** grupo responsável por analisar as propostas e definir o resultado da licitação.
- **Administrador do Sistema:** responsável pela administração da plataforma e pelo acesso autorizado aos registros de auditoria.

## UC-01 - Cadastrar empresa

**Ator principal:** Empresa/Fornecedor.

**Objetivo:** criar o cadastro da empresa no sistema para que ela possa participar de licitações.

**Fluxo principal:**

1. A empresa informa seus dados cadastrais.
2. A empresa envia os documentos de habilitação.
3. A empresa cadastra seus representantes.
4. A empresa informa seus dados bancários.
5. O sistema registra o cadastro.

## UC-02 - Realizar login

**Atores principais:** Empresa/Fornecedor, Servidor Público, Comissão de Licitação e Administrador do Sistema.

**Objetivo:** autenticar o usuário e liberar as funcionalidades permitidas para seu perfil.

**Fluxo principal:**

1. O usuário informa suas credenciais.
2. O sistema verifica as credenciais.
3. O sistema identifica o perfil do usuário.
4. O sistema libera o acesso às funcionalidades autorizadas.

## UC-03 - Cadastrar licitação

**Ator principal:** Servidor Público.

**Objetivo:** registrar uma nova licitação no sistema.

**Fluxo principal:**

1. O servidor informa o objeto da licitação.
2. O servidor define os prazos, requisitos e o valor estimado.
3. O servidor anexa o edital e os demais documentos necessários.
4. O sistema registra a licitação.

## UC-04 - Publicar licitação

**Ator principal:** Servidor Público.

**Objetivo:** disponibilizar uma licitação cadastrada para as empresas.

**Fluxo principal:**

1. O servidor seleciona uma licitação cadastrada.
2. O servidor solicita sua publicação.
3. O sistema disponibiliza a licitação para consulta pelas empresas cadastradas.

## UC-05 - Consultar licitações

**Ator principal:** Empresa/Fornecedor.

**Objetivo:** consultar os processos de licitação disponíveis e suas condições de participação.

**Fluxo principal:**

1. A empresa acessa a relação de licitações disponíveis.
2. A empresa seleciona uma licitação.
3. O sistema apresenta o edital, os requisitos, os documentos e os prazos do processo.

## UC-06 - Enviar proposta

**Ator principal:** Empresa/Fornecedor.

**Objetivo:** registrar uma proposta comercial para uma licitação com prazo aberto.

**Fluxo principal:**

1. A empresa seleciona uma licitação.
2. A empresa informa sua proposta comercial.
3. A empresa anexa os documentos exigidos.
4. A empresa confirma o envio.
5. O sistema registra a proposta, incluindo a data e o horário do envio.

## UC-07 - Alterar ou retirar proposta

**Ator principal:** Empresa/Fornecedor.

**Objetivo:** permitir que a empresa altere ou retire sua própria proposta antes do encerramento do prazo.

**Fluxo principal:**

1. A empresa acessa uma proposta enviada.
2. O sistema verifica se o prazo da licitação permanece aberto.
3. A empresa escolhe alterar ou retirar a proposta.
4. O sistema registra a operação, incluindo a data e o horário.

## UC-08 - Manter proposta sigilosa

**Responsável:** Sistema.

**Objetivo:** preservar a confidencialidade das propostas até o encerramento do prazo da licitação.

**Comportamento esperado:**

1. O sistema restringe o acesso ao conteúdo das propostas enquanto o prazo estiver aberto.
2. O sistema impede que uma empresa visualize propostas de concorrentes.
3. O sistema libera as propostas para a Comissão de Licitação somente após o encerramento do prazo.

## UC-09 - Analisar propostas

**Ator principal:** Comissão de Licitação.

**Objetivo:** avaliar as propostas comerciais e os documentos apresentados pelas empresas.

**Fluxo principal:**

1. Após o encerramento do prazo, a comissão acessa as propostas.
2. A comissão analisa os valores e a documentação de cada participante.
3. A comissão registra a aprovação, a reprovação ou a necessidade de análise adicional de cada proposta.

## UC-10 - Definir vencedor

**Ator principal:** Comissão de Licitação.

**Objetivo:** registrar a empresa vencedora da licitação e justificar a decisão.

**Fluxo principal:**

1. A comissão consulta as propostas analisadas.
2. A comissão seleciona a empresa vencedora.
3. A comissão registra a justificativa da decisão.
4. O sistema armazena o resultado.

## UC-11 - Publicar resultado

**Ator principal:** Comissão de Licitação ou Servidor Público autorizado.

**Objetivo:** disponibilizar o resultado da licitação para consulta.

**Fluxo principal:**

1. O usuário autorizado seleciona uma licitação concluída.
2. O usuário solicita a publicação do resultado.
3. O sistema disponibiliza a empresa vencedora e a justificativa da decisão.

## UC-12 - Consultar logs de auditoria

**Ator principal:** Administrador do Sistema ou usuário autorizado.

**Objetivo:** consultar os registros de acesso e das operações relevantes realizadas no sistema.

**Fluxo principal:**

1. O usuário autorizado acessa a área de auditoria.
2. O usuário informa os critérios da consulta.
3. O sistema apresenta os registros correspondentes.
4. Para cada operação, o sistema identifica o usuário, a ação realizada e a data e o horário do evento.

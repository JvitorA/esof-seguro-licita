# Casos de abuso

Este documento reúne os casos de abuso iniciais do sistema de licitações. Eles descrevem ações mal-intencionadas ou indevidas que podem comprometer a confidencialidade, a integridade, a disponibilidade e a rastreabilidade do processo licitatório.

## CA-01 - Acessar proposta antes do prazo

**Agente da ameaça:** Servidor ou outro usuário mal-intencionado.

**Cenário:** o agente tenta visualizar propostas comerciais antes do encerramento do prazo da licitação.

**Risco:** obtenção de vantagem indevida por uma empresa concorrente e quebra da confidencialidade das propostas.

## CA-02 - Alterar proposta de outra empresa

**Agente da ameaça:** Usuário mal-intencionado ou atacante com acesso não autorizado.

**Cenário:** o agente tenta modificar o valor, os documentos ou outras informações de uma proposta enviada por outro fornecedor.

**Risco:** fraude e comprometimento da integridade dos dados da proposta.

## CA-03 - Enviar proposta em nome de outra empresa

**Agente da ameaça:** Atacante em posse das credenciais de uma empresa.

**Cenário:** o agente utiliza a conta comprometida para cadastrar, alterar ou retirar propostas em nome da empresa.

**Risco:** falsidade, fraude e uso indevido da identidade do fornecedor.

## CA-04 - Roubar credenciais de usuário

**Agente da ameaça:** Atacante externo ou usuário mal-intencionado.

**Cenário:** o agente tenta obter as credenciais de fornecedores, servidores ou membros da comissão por meio de phishing, vazamento de senha ou tentativa de adivinhação.

**Risco:** acesso não autorizado à conta da vítima e às funcionalidades permitidas para seu perfil.

## CA-05 - Elevar privilégios

**Agente da ameaça:** Usuário autenticado com permissões limitadas.

**Cenário:** o agente tenta obter permissões de Administrador do Sistema ou de membro da Comissão de Licitação.

**Risco:** acesso a informações restritas e possibilidade de manipulação do processo licitatório.

## CA-06 - Excluir documentos ou propostas

**Agente da ameaça:** Usuário mal-intencionado ou atacante com acesso não autorizado.

**Cenário:** o agente tenta apagar propostas ou documentos enviados pelos participantes.

**Risco:** indisponibilidade de informações, prejuízo aos participantes e possível favorecimento de concorrentes.

## CA-07 - Modificar o resultado da licitação

**Agente da ameaça:** Atacante ou usuário interno mal-intencionado.

**Cenário:** o agente tenta alterar a empresa vencedora, a pontuação, a justificativa ou outro dado do resultado registrado.

**Risco:** fraude direta e comprometimento da integridade do processo licitatório.

## CA-08 - Cadastrar documentos falsos

**Agente da ameaça:** Empresa/Fornecedor mal-intencionado.

**Cenário:** a empresa envia documentos adulterados ou informações falsas para aparentar que atende aos requisitos da licitação.

**Risco:** participação ou habilitação irregular do fornecedor.

## CA-09 - Acessar dados de outras empresas

**Agente da ameaça:** Empresa/Fornecedor ou usuário mal-intencionado.

**Cenário:** o agente tenta consultar documentos, dados bancários ou informações cadastrais de outros fornecedores sem autorização.

**Risco:** vazamento de dados e quebra da confidencialidade das empresas participantes.

## CA-10 - Apagar ou alterar logs

**Agente da ameaça:** Usuário privilegiado mal-intencionado.

**Cenário:** o agente tenta remover ou modificar registros de suas próprias ações ou das ações de terceiros para esconder uma atividade irregular.

**Risco:** comprometimento da auditoria, perda de rastreabilidade e dificuldade para identificar os responsáveis.

## CA-11 - Sobrecarregar o sistema

**Agente da ameaça:** Atacante externo ou grupo de atacantes.

**Cenário:** o agente realiza uma grande quantidade de requisições para tornar o sistema indisponível, especialmente próximo ao prazo final para envio de propostas.

**Risco:** impedimento da participação de empresas legítimas e comprometimento da disponibilidade do processo licitatório.

## CA-12 - Enviar arquivo malicioso

**Agente da ameaça:** Empresa/Fornecedor ou usuário mal-intencionado.

**Cenário:** o agente anexa um arquivo com conteúdo malicioso no lugar de um documento legítimo.

**Risco:** comprometimento do servidor ou dos computadores usados pelos responsáveis pela análise.

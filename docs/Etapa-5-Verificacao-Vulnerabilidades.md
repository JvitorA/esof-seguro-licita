# Etapa 5: verificação de vulnerabilidades

Uma sessão de verificação no laboratório local do Licita+. O alvo é a aplicação do grupo, com dados fictícios. O código está em [laboratorio](../laboratorio/README.md).

## Ambiente

- Ferramenta: ZAP, pelo Manual Explore. A varredura ativa é opcional.
- Alvo da sessão: `http://127.0.0.1:3000`, modo vulnerável.
- Comparação, quando ajudar a descrever a correção: `http://127.0.0.1:3001`. Essa porta fica fora de uma varredura ativa feita na 3000.
- Subida: `docker compose up -d --build`, na raiz do repositório.
- Contas: [documentação do laboratório](../laboratorio/README.md#contas-fictícias).

Abra o laboratório sempre por `http://127.0.0.1:3000`. O login compara a origem do formulário com o host do pedido; misturar `localhost` e `127.0.0.1` responde 403 antes de verificar a senha.

## Configuração da sessão

1. Confirme que `http://127.0.0.1:3000` abre no navegador.
2. No ZAP, anote a versão. Em Quick Start, use Manual Explore e abra `http://127.0.0.1:3000` no navegador iniciado pelo ZAP.
3. Inclua no contexto somente `http://127.0.0.1:3000`.
4. Entre como Ana (`ana@alfa.test`), percorra as licitações e abra a proposta 1. As requisições precisam aparecer no Histórico.
5. Faça os três testes abaixo. A evidência de cada um é a linha do Histórico exportada ou fotografada, com pedido e resposta.
6. Se a varredura ativa for executada, anote política, autenticação e escopo. Sem a sessão da Ana, a varredura não alcança as páginas autenticadas.

O botão **Sair da conta** fica na visão geral. A edição de proposta só é aceita enquanto o recebimento da licitação está aberto. Se a PE 042/2026 já estiver encerrada, restaure os dados:

```sh
docker compose down --volumes
docker compose up -d
```

Referências: [ZAP Quick Start](https://www.zaproxy.org/docs/desktop/addons/quick-start/) e [limitações da varredura ativa](https://www.zaproxy.org/docs/desktop/start/features/ascan/).

## A01: SQL injection no login

1. Saia da conta.
2. Na porta 3000, use o e-mail `ana@alfa.test' -- ` e uma senha qualquer, como `123`. O e-mail vai sem crases em volta.
3. No Histórico, abra o `POST /login`. O resultado esperado é `303 See Other`, com `Location: /` e `Set-Cookie: licita_vulneravel`.

A consulta vulnerável concatena o e-mail. O comentário SQL faz a verificação da senha ser ignorada. A varredura passiva pode não criar um alerta de injeção de SQL: um 303 sem erro de banco costuma aparecer só como cookie informativo. O achado, nesse caso, é manual.

A correção proposta é passar e-mail e senha como parâmetros da consulta. Os hashes com salt já existem nos dois modos. O mesmo corpo na porta 3001 deve responder 401, sem cookie novo.

Referência: [CWE-89](https://cwe.mitre.org/data/definitions/89.html). O efeito é a falsificação da identidade da Ana, ligada a T-01, CA-03, R-03 e R-04. O teste não cobre o segundo fator previsto no RS-03.

## A02: consulta e alteração de proposta de outra empresa

A licitação 1 precisa estar aberta.

1. Na porta 3000, entre como Ana. A listagem mostra as propostas da Alfa.
2. Abra `/propostas/2`, da Beta. O acesso esperado é permitido, mesmo sem o link na listagem.
3. Em `/propostas/2/editar`, grave o valor `120.00`. O formulário envia o token CSRF da Ana. Esse token não verifica se a proposta é da empresa dela.
4. Saia e entre como Bruno. A proposta 2 deve mostrar R$ 120,00.

A correção proposta é comparar, no servidor, a empresa da sessão com a empresa titular da proposta, na leitura e na alteração. Na porta 3001 a consulta e a edição devem responder 403, e Bruno segue vendo R$ 168.400,00.

Referência: [CWE-639](https://cwe.mitre.org/data/definitions/639.html). O achado corresponde a T-04, T-13, T-19, T-20, CA-02, CA-09, R-02, R-05, R-09 e ao requisito RS-02.

## A03: XSS armazenado nas observações

Faça este teste com a licitação 1 ainda aberta, ou depois de restaurar os dados.

1. Na porta 3000, entre como Bruno e abra `/propostas/1/editar`.
2. Mantenha o valor da proposta e troque as observações pelo trecho abaixo.

```html
<img src="/imagem-inexistente" onerror="document.querySelector('h1').textContent='XSS demonstrado'">
```

3. Salve. Ao abrir a proposta, o título principal deve passar a `XSS demonstrado`.

A correção proposta é exibir as observações como texto, com escape na saída HTML. No modo corrigido o campo sai codificado, e a Content Security Policy é uma defesa a mais. Na porta 3001 o mesmo trecho deve aparecer literalmente, sem mudar o título.

Referência: [CWE-79](https://cwe.mitre.org/data/definitions/79.html). O trecho executa JavaScript no navegador que abre a proposta, em relação a R-05 e R-07. O efeito é a troca do título. O teste não mede mudança do resultado da licitação nem privilégio administrativo.

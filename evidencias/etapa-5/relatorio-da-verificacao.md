# Registro da sessão de verificação

## Identificação

- Sistema testado: laboratório local do Licita+, modo vulnerável, em `http://127.0.0.1:3000`, com dados fictícios. Os três achados usam pedidos de 26/11/2026, das 23:08:46 às 23:44:47, horário de Brasília.
- Ferramenta: OWASP ZAP 2.17.0. A versão aparece na barra das capturas. O navegador encaminhado ao ZAP foi o Chrome, em macOS.
- Configuração: Manual Explore, com o proxy em `127.0.0.1:8080`. O Histórico usado nos achados é o de `http://127.0.0.1:3000`.
- Evidência: [a01.raw](a01.raw), [a01.png](a01.png), [a02.raw](a02.raw), [a02.png](a02.png), [a02-beta.raw](a02-beta.raw), [a03.raw](a03.raw), [a03-zap.png](a03-zap.png) e [a03-no-sistema.png](a03-no-sistema.png).

## Achados

A tabela segue o modelo sugerido no enunciado. O A01 foi confirmado à mão no Histórico do ZAP 2.17.0, linha 16, às 23:08:46 de 26/11/2026, horário de Brasília. A varredura passiva não marcou injeção de SQL. O alerta da linha é Informativo, por causa do cookie. O A02 está na linha 51 do mesmo Histórico, às 23:38:43. O corpo enviou `value=120`, e a listagem do Bruno, às 23:39:37, mostrou R$ 120,00. O A03 está na linha 94, às 23:44:47. O título da proposta 1 passou a `XSS demonstrado`, e a linha 97 pediu `/imagem-inexistente` com resposta `404`.

| ID | Alerta ou achado | Evidência | Possível impacto | Relação com OWASP ou CWE | Correção proposta |
| --- | --- | --- | --- | --- | --- |
| A01 | No `POST /login` da porta 3000, o e-mail `ana@alfa.test' --` e a senha `123` receberam `303 See Other`, com `Location: /` e `Set-Cookie: licita_vulneravel`. A senha `123` não é a da Ana. O POST das 23:08:28, com 401, ficou de fora. | [a01.raw](a01.raw) traz a requisição e a resposta. [a01.png](a01.png) mostra o ZAP com esse pedido aberto e a linha 303 selecionada. O mesmo corpo, enviado à porta 3001 às 23:18, respondeu 401, com "E-mail ou senha inválidos." e sem `Set-Cookie`. | A porta 3000 abriu sessão para `ana@alfa.test` com a senha errada. É a falsificação da identidade da Ana, já descrita em T-01, CA-03, R-03 e R-04. A imagem para antes do portal autenticado. O teste não cobre o segundo fator previsto no RS-03. | [CWE-89](https://cwe.mitre.org/data/definitions/89.html). O e-mail entrou no comando SQL. | Receber e-mail e senha como parâmetros da consulta. |
| A02 | No `POST /propostas/2/editar` da porta 3000, a sessão ativa às 23:38:43 enviou `value=120` e as observações originais da Beta. A resposta foi `303 See Other`, com `Location: /propostas/2`. O cookie era `licita_vulneravel`. Às 23:39:14 essa sessão saiu; o login das 23:39:18 abriu a conta do Bruno. | [a02.raw](a02.raw) traz o POST e o 303. [a02.png](a02.png) mostra o ZAP 2.17.0 com a linha 51 selecionada. [a02-beta.raw](a02-beta.raw) é o `GET /propostas` das 23:39:37, com o avatar BC, e a PR-0002 da Beta Soluções a R$ 120,00. A porta 3001 não foi retestada. | A proposta da Beta, que no laboratório começa em R$ 168.400,00, passou a R$ 120,00 na listagem do Bruno. A sessão da Alfa leu e alterou um objeto de outra empresa. O efeito se liga a T-04, T-13, T-19, T-20, CA-02, CA-09, R-02, R-05, R-09 e ao RS-02. | [CWE-639](https://cwe.mitre.org/data/definitions/639.html). O identificador 2 foi aceito sem comparar a empresa da sessão com a empresa da proposta. | Comparar, no servidor, a empresa da sessão com a empresa titular da proposta, na leitura e na alteração. |
| A03 | No `POST /propostas/1/editar` da porta 3000, às 23:44:47, a sessão do Bruno enviou `value=172800.00` e, em `notes`, o trecho `img` com `onerror` que define o título como `XSS demonstrado`. O cookie é o mesmo de [a02-beta.raw](a02-beta.raw). A resposta foi `303 See Other`, com `Location: /propostas/1`. | [a03.raw](a03.raw) traz o POST e o 303. [a03-zap.png](a03-zap.png) mostra o ZAP 2.17.0 com a linha 94 selecionada; a linha 97 é o `GET /imagem-inexistente` com `404`. [a03-no-sistema.png](a03-no-sistema.png) mostra `/propostas/1` com o avatar BC, a empresa Alfa Tecnologia, R$ 172.800,00 e o título `XSS demonstrado`. A porta 3001 não foi retestada. | O JavaScript gravado na observação da proposta da Alfa rodou no navegador do Bruno e trocou o título. O efeito se liga a R-05 e R-07. O teste não mede mudança do resultado da licitação nem privilégio administrativo. | [CWE-79](https://cwe.mitre.org/data/definitions/79.html). A observação foi armazenada e a página a devolveu como HTML. | Exibir as observações como texto, com escape na saída HTML. |

## Alertas médios

A varredura passiva marcou dois alertas médios em `http://127.0.0.1:3000`. Eles não entram nos três achados da tabela.

- Content Security Policy (CSP) Header Not Set, 10 vezes, [CWE-693](https://cwe.mitre.org/data/definitions/693.html). Dez respostas da porta 3000, entre elas `/login`, `/`, `/propostas`, `/propostas/1`, `/propostas/2` e `/imagem-inexistente`, não trouxeram `Content-Security-Policy`. Sem esse cabeçalho, o navegador não restringe a origem do script. No A03, a observação saiu como HTML e o título mudou. A correção é enviar a política nas respostas HTML.
- Ausência de tokens Anti-CSRF, 2 vezes, [CWE-352](https://cwe.mitre.org/data/definitions/352.html). O alerta aponta o formulário de `GET /login` e o `POST /login`, que seguem sem token. Os `POST` de edição de proposta enviam `_csrf` e não aparecem nesse alerta. A correção é incluir um token também no formulário de login.

## Alertas informativos

O ZAP não abriu alerta de injeção de SQL, de autorização por objeto nem de XSS. Os três achados da tabela foram lidos no Histórico. Os resultados informativos abaixo não entraram nessa análise.

- Solicitação de autenticação identificada, 3 vezes, em `POST /login` da porta 3000. O ZAP reconheceu e-mail e senha nos logins da Ana e no do Bruno. O mesmo aviso se repete a cada login.
- Session Management Response Identified, 2 vezes. As respostas `303` do login definiram o cookie `licita_vulneravel`. É o aviso informativo citado no A01.
- Re-examine Cache-control Directives, 4 vezes, em `www.google.com` e `content-autofill.googleapis.com`. São pedidos do Chrome, fora do Licita+.

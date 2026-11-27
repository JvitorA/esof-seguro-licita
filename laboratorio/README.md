# Laboratório Licita+

Aplicação didática em TypeScript, Fastify e SQLite. Reproduz três classes de falha estudadas no [audiufu](https://github.com/JvitorA/audiufu), com fluxos de propostas de licitação. O código foi reimplementado para este trabalho; o audiufu é a referência dos cenários, não uma dependência.

O modo `vulneravel` contém falhas intencionais. O modo `corrigido` corrige os três cenários e acrescenta uma política de conteúdo. O nome não implica que toda a aplicação ou a arquitetura proposta tenha sido certificada como segura.

## Executar com Docker

Na raiz do repositório, com Docker Desktop e Compose disponíveis:

```sh
docker compose up -d --build
docker compose ps
```

- Vulnerável: <http://127.0.0.1:3000>.
- Corrigido: <http://127.0.0.1:3001>.
- Verificação de funcionamento: `/health` em cada endereço.

Cada serviço tem seu próprio volume SQLite. Os cookies se chamam `licita_vulneravel` e `licita_corrigido`, permitindo usar as duas portas no mesmo navegador sem trocar a identidade entre os modos.

Para parar preservando os dados:

```sh
docker compose down
```

Para apagar somente os dados fictícios dos volumes deste projeto e reconstruir o cenário inicial:

```sh
docker compose down --volumes
docker compose up -d
```

As alterações feitas em propostas permanecem após reiniciar. Ao restaurar os volumes, os prazos relativos são recalculados e as sessões anteriores deixam de funcionar.

## Contas fictícias

- Fornecedor Alfa: `ana@alfa.test`, senha `Alfa@123456`.
- Fornecedor Beta: `bruno@beta.test`, senha `Beta@123456`.
- Comissão: `carla@comissao.test`, senha `Comissao@123456`.
- Servidor público: `sergio@licita.test`, senha `Servidor@123456`.
- Administração: `admin@licita.test`, senha `Admin@123456`.

As propostas iniciais 1 e 2 pertencem, respectivamente, à Alfa e à Beta na licitação PE 042/2026, que recebe propostas. As propostas 3 e 4 pertencem à licitação PE 038/2026, já encerrada. A PE 047/2026 começa sem propostas.

O servidor pode encerrar o recebimento na página de uma licitação. Essa operação avança o ciclo do laboratório para que a comissão consulte as propostas; depois do encerramento, fornecedores não podem editá-las. Para repetir o ciclo, restaure os dados.

## Executar com Node.js

Use Node.js 24.x. A aplicação usa `node:sqlite`, incluído nessa versão, sem compilar drivers nativos adicionais.

```sh
cd laboratorio
npm ci
npm run start:vulneravel
```

Em outro terminal, na mesma pasta:

```sh
npm run start:corrigido
```

Os endereços continuam sendo as portas 3000 e 3001. Pare os containers antes de usar essas mesmas portas localmente. `PORT`, `HOST` e `DB_PATH` permitem configurar a execução; fora do Docker, a escuta padrão é `127.0.0.1`. O modo padrão é `corrigido`; valores desconhecidos são recusados.

Para restaurar os bancos locais, pare os dois processos e execute `npm run reset`. Isso remove apenas `laboratorio/data/vulneravel.sqlite`, `corrigido.sqlite` e seus arquivos auxiliares. Não altera volumes Docker nem um `DB_PATH` personalizado.

## Verificar a implementação

```sh
cd laboratorio
npm run check
npm test
npm run build
```

Os testes usam bancos em memória e verificam login, SQL injection, leitura e alteração entre empresas, persistência e codificação do XSS, CSRF, valores inválidos, perfis, encerramento, revogação e isolamento das sessões. Os testes de XSS inspecionam a resposta HTML; a execução do JavaScript deve ser observada no navegador durante a verificação manual.

## Localizar as decisões no código

- `src/database.ts`: consulta de login vulnerável e parametrizada; hashes de senha com sal; sessões e dados iniciais.
- `src/policy.ts`: autorização por perfil, empresa e prazo, com a omissão intencional no modo vulnerável.
- `src/views.ts`: saída HTML das observações, com e sem escape.
- `src/app.ts`: rotas, CSRF, cookies, cabeçalhos e auditoria.
- `test/security.test.ts`: comparação dos comportamentos dos dois modos.

O recorte implementa parte do RS-02 e dos controles de sessão do RS-03. MFA, fila persistente de submissões, proteção anti-DDoS e armazenamento independente de auditoria continuam como propostas arquiteturais. O log SQLite demonstra os eventos; não é uma trilha imutável. A SQL injection e o XSS ampliam os cenários de verificação e não devem ser confundidos com o mapeamento completo dos três requisitos da Etapa 3.

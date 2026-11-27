import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

// Execute com os servidores locais parados. O caminho é fixo para não apagar
// um DB_PATH externo por engano; volumes Docker são restaurados pelo Compose.
for (const mode of ['vulneravel', 'corrigido']) {
  const path = resolve(import.meta.dirname, '..', 'data', `${mode}.sqlite`);
  for (const suffix of ['', '-wal', '-shm']) rmSync(`${path}${suffix}`, { force: true });
}
console.log('Bancos locais removidos. A próxima inicialização recria os dados fictícios.');

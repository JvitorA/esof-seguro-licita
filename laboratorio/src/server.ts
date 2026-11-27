import { resolve } from 'node:path';
import { buildApp } from './app.js';
import type { LabMode } from './types.js';

const selected = process.argv.find((arg) => arg.startsWith('--mode='))?.split('=')[1] ?? process.env.LAB_MODE ?? 'corrigido';
if (selected !== 'vulneravel' && selected !== 'corrigido') throw new Error('LAB_MODE deve ser vulneravel ou corrigido.');
const mode: LabMode = selected;
const port = Number(process.env.PORT ?? (mode === 'vulneravel' ? 3000 : 3001));
const host = process.env.HOST ?? '127.0.0.1';
const dbPath = process.env.DB_PATH ?? resolve('data', `${mode}.sqlite`);
const app = await buildApp({ mode, dbPath, logger: true });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { void app.close().then(() => process.exit(0)); });
}
try {
  await app.listen({ host, port });
  console.log(`Licita+ (${mode}): http://127.0.0.1:${port}`);
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}

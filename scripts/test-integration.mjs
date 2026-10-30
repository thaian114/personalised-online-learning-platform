// Every test file gets its own disposable, seeded SQLite database.
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = mkdtempSync(join(tmpdir(), 'luma-interim-tests-'));
const prismaCli = resolve('node_modules/prisma/build/index.js');
function run(args, env) {
  const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Command failed (${result.status}): node ${args.join(' ')}`);
}
try {
  run([prismaCli, 'generate', '--schema=src/backend/prisma/schema.prisma'], process.env);
  for (const file of readdirSync('tests')
    .filter((name) => name.endsWith('.test.js'))
    .sort()) {
    // Prisma 5's Windows engine requires the SQLite file to exist first.
    writeFileSync(join(directory, file + '.db'), '');
    const env = {
      ...process.env,
      DATABASE_URL: 'file:' + join(directory, file + '.db').replaceAll('\\', '/'),
      NODE_ENV: 'test',
    };
    run(
      [prismaCli, 'db', 'push', '--schema=src/backend/prisma/schema.prisma', '--skip-generate'],
      env,
    );
    run(['src/backend/seed.js'], env);
    run(['--test', 'tests/' + file], env);
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}

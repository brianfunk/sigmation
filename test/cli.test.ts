import { describe, expect, it } from 'vitest';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = promisify(execFile);
const CLI = ['--import', 'tsx', 'src/cli.ts'];

describe('cli', () => {
  it('prints svg to stdout', async () => {
    const { stdout } = await run('node', [...CLI, 'x^2']);
    expect(stdout).toMatch(/^<svg/);
  });

  it('infers format from the output extension and writes a file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sigmation-'));
    const out = join(dir, 'eq.png');
    await run('node', [...CLI, '\\frac{a}{b}', '-o', out, '--scale', '3']);
    const bytes = await readFile(out);
    expect(bytes[0]).toBe(0x89);
  });

  it('reads stdin and renders mml', async () => {
    const stdout = execFileSync('node', [...CLI, '-f', 'mml'], { input: 'a+b', encoding: 'utf8' });
    expect(stdout).toMatch(/^<math/);
  });

  it('exits 1 with a message on bad TeX', async () => {
    await expect(run('node', [...CLI, '\\frac{a'])).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('TeX error') });
  });

  it('shows help', async () => {
    const { stdout } = await run('node', [...CLI, '--help']);
    expect(stdout).toContain('Usage');
  });
});

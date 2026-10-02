#!/usr/bin/env node
/*

 ______ _                       _   _
 \  ___|_)                     | | (_)
  \ \   _  __ _ _ __ ___   __ _| |_ _  ___  _ __
   > > | |/ _` | '_ ` _ \ / _` | __| |/ _ \| '_ \
  / /__| | (_| | | | | | | (_| | |_| | (_) | | | |
 /_____)_|\__, |_| |_| |_|\__,_|\__|_|\___/|_| |_|
           __/ |
          |___/

*/

import { parseArgs } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { sigmation, SigmationError, normalizeFormat, optionsFromRaw } from './core/index.js';

const BANNER = String.raw`
 ______ _                       _   _
 \  ___|_)                     | | (_)
  \ \   _  __ _ _ __ ___   __ _| |_ _  ___  _ __
   > > | |/ _\` | '_ \` _ \ / _\` | __| |/ _ \| '_ \
  / /__| | (_| | | | | | | (_| | |_| | (_) | | | |
 /_____)_|\__, |_| |_| |_|\__,_|\__|_|\___/|_| |_|
           __/ |
          |___/
`;

const HELP = `${BANNER}
  Render math (AsciiMath, TeX) to SVG, PNG, MathML, HTML or a badge.

  Usage
    sigmation <math> [options]
    echo '<math>' | sigmation [options]

  Options
    -f, --format <svg|png|mml|html|badge>   output format (default: svg, or from -o extension)
    -o, --out <file>                        write to a file instead of stdout
    -l, --lang <tex|ascii>                  input language (default: auto-detect)
    -i, --inline                            inline (text-style) math
    -c, --color <hex>                       foreground color (default: #000, or #fff with --theme dark)
        --bg <hex|transparent>              background color (default: transparent)
        --theme <light|dark>                color shorthand
    -s, --scale <n>                         size multiplier, 0.25-8 (default: 1, png: 2)
    -w, --width <px>                        png width
    -h, --height <px>                       png height
        --label <text>                      badge label (default: Σ)
        --badge-color <hex>                 badge right-side color (default: #4c1)
        --help                              show this help
    -v, --version                           show version

  Examples
    sigmation 'sum_(i=1)^N 2^i' > sum.svg
    sigmation '\\frac{a}{b}' -l tex -o frac.png --scale 3 --theme dark
    sigmation 'E=mc^2' -f badge --label physics > badge.svg
`;

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        format: { type: 'string', short: 'f' },
        out: { type: 'string', short: 'o' },
        lang: { type: 'string', short: 'l' },
        inline: { type: 'boolean', short: 'i' },
        color: { type: 'string', short: 'c' },
        bg: { type: 'string' },
        theme: { type: 'string' },
        scale: { type: 'string', short: 's' },
        width: { type: 'string', short: 'w' },
        height: { type: 'string', short: 'h' },
        label: { type: 'string' },
        'badge-color': { type: 'string' },
        help: { type: 'boolean' },
        version: { type: 'boolean', short: 'v' },
      },
    });
  } catch (e) {
    process.stderr.write(`sigmation: ${(e as Error).message}\n`);
    return 2;
  }
  const { values, positionals } = parsed;

  if (values.help) {
    process.stdout.write(HELP);
    return 0;
  }
  if (values.version) {
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    process.stdout.write(`${pkg.version}\n`);
    return 0;
  }

  const input = positionals.length ? positionals.join(' ') : (await readStdin()).trim();
  if (!input) {
    process.stderr.write(HELP);
    return 2;
  }

  try {
    const extFromOut = values.out?.match(/\.(svg|png|mml|html)$/i)?.[1];
    const format = normalizeFormat(values.format ?? extFromOut);
    const opts = optionsFromRaw({
      lang: values.lang,
      inline: values.inline ? '1' : undefined,
      color: values.color,
      bg: values.bg,
      theme: values.theme,
      scale: values.scale,
      width: values.width,
      height: values.height,
      label: values.label,
      badgeColor: values['badge-color'],
    });
    const out = await sigmation(input, format, opts);
    if (values.out) {
      await writeFile(values.out, out.body);
      process.stderr.write(`wrote ${values.out}\n`);
    } else {
      process.stdout.write(out.body);
      if (typeof out.body === 'string' && !out.body.endsWith('\n')) process.stdout.write('\n');
    }
    return 0;
  } catch (e) {
    const msg = e instanceof SigmationError ? e.message : `unexpected error: ${(e as Error).message}`;
    process.stderr.write(`sigmation: ${msg}\n`);
    return 1;
  }
}

if (process.argv[1] && /[\\/]cli\.(js|ts)$/.test(process.argv[1])) {
  main().then((code) => process.exit(code));
}

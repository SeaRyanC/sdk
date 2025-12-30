import * as esbuild from 'esbuild';
import * as fs from 'fs';

async function build() {
  // Bundle JavaScript
  await esbuild.build({
    entryPoints: ['src/main.tsx'],
    bundle: true,
    minify: true,
    sourcemap: false,
    outfile: 'docs/main.js',
    format: 'esm',
    jsx: 'automatic',
    jsxImportSource: 'preact',
    target: ['es2020'],
  });

  // Copy CSS
  fs.copyFileSync('src/styles.css', 'docs/styles.css');
  
  // Copy HTML
  fs.copyFileSync('src/index.html', 'docs/index.html');
  
  // Copy manifest for PWA
  fs.copyFileSync('src/manifest.json', 'docs/manifest.json');
  
  // Copy service worker
  fs.copyFileSync('src/sw.js', 'docs/sw.js');

  console.log('Build complete! Output in /docs');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { sveltePhosphorOptimize } from 'phosphor-svelte/vite';
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const buildTime = Date.now();

const certPath = path.resolve(import.meta.dirname, 'dev-certs/cert.pem');
const keyPath = path.resolve(import.meta.dirname, 'dev-certs/key.pem');
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

const httpsOptions = hasCerts
  ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    }
  : undefined;

const versionPath = path.resolve(import.meta.dirname, 'public/version.json');

/** Reads public/version.json (if present), applies `patch`, and writes it back. */
function writeVersionJson(patch: Record<string, any>, extraOutFile?: string): Record<string, any> {
  let data: Record<string, any> = {};
  if (fs.existsSync(versionPath)) {
    try {
      data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
    } catch {}
  }
  Object.assign(data, patch);
  if (!data.dbVersion) {
    data.dbVersion = 'initial';
  }
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(versionPath, content);
  if (extraOutFile) {
    fs.writeFileSync(extraOutFile, content);
  }
  return data;
}

/** Recursively lists every file under `dir`, returned as '/'-prefixed paths relative to it. */
function listFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  const walk = (abs: string, rel: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absChild = path.join(abs, entry.name);
      const relChild = `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(absChild, relChild);
      } else {
        out.push(relChild);
      }
    }
  };
  walk(dir, '');
  return out;
}

// Cross-hook state for the 'update-version-json' plugin below. Rollup/Vite
// does not guarantee the same `this` (PluginContext) instance is handed to
// different hooks of the same plugin, so this must live in module scope
// rather than as a property stashed on `this`.
let pendingAssets: Set<string> = new Set();
let pendingEntryJs = '';

export default defineConfig({
  plugins: [
    svelte(),
    sveltePhosphorOptimize(),
    {
      name: 'update-version-json',
      generateBundle(_options, bundle) {
        const assets = new Set<string>();
        assets.add('/');
        assets.add('/index.html');
        assets.add('/manifest.webmanifest');
        assets.add('/favicon.svg');
        assets.add('/sw.js');

        let entryJs = '';
        for (const [fileName, file] of Object.entries(bundle)) {
          assets.add('/' + fileName);
          if (file.type === 'chunk' && file.isEntry) {
            entryJs = '/' + fileName;
          }
        }

        pendingAssets = assets;
        pendingEntryJs = entryJs;

        const content = writeVersionJson({
          appVersion: pkg.version || '0.1.0',
          buildTime,
          entryJs,
          appAssets: Array.from(assets)
        });

        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify(content, null, 2)
        });
      },
      writeBundle(options) {
        // Some assets - notably files emitted by nested Web Worker sub-builds,
        // such as the @sqlite.org/sqlite-wasm .wasm file used by the shared DB
        // worker - are written to disk during worker bundling but may not show
        // up in the `bundle` object seen by generateBundle above. Do a final
        // disk-level sweep of the actual output directory so version.json's
        // appAssets (used by downloadAppAssets() for offline pre-caching)
        // reliably includes everything the app shell needs, regardless of how
        // Vite internally structured the (possibly multi-pass) build.
        const outDir = options.dir
          ? path.resolve(options.dir)
          : path.resolve(import.meta.dirname, 'dist');

        const assets = new Set<string>(pendingAssets);
        for (const rel of listFilesRecursive(outDir)) {
          // words.db is downloaded separately (Task 5's own verified/streamed
          // path) and must never be swept into the app-shell asset cache.
          if (/\/words\.db(\.tmp|\.download)?$/.test(rel)) continue;
          assets.add(rel);
        }

        const outVersionFile = path.join(outDir, 'version.json');
        writeVersionJson(
          {
            appVersion: pkg.version || '0.1.0',
            buildTime,
            entryJs: pendingEntryJs,
            appAssets: Array.from(assets)
          },
          outVersionFile
        );
      }
    }
  ],
  server: {
    https: httpsOptions,
    host: true
  },
  preview: {
    https: httpsOptions,
    host: true
  },
  build: {
    modulePreload: false
  },
  worker: {
    // @sqlite.org/sqlite-wasm uses import.meta.url / dynamic import() to
    // locate its .wasm file; the worker build must emit ES modules for that
    // to resolve correctly (also required for `new Worker(url, {type:'module'})`).
    format: 'es'
  },
  optimizeDeps: {
    // Required by @sqlite.org/sqlite-wasm: it must not be pre-bundled by
    // esbuild in dev (it relies on import.meta.url-relative asset URLs and
    // top-level await that esbuild's dev prebundler doesn't handle well).
    exclude: ['@sqlite.org/sqlite-wasm']
  },
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __APP_VERSION__: JSON.stringify(pkg.version || '0.1.0')
  }
});

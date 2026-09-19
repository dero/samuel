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

        const versionPath = path.resolve(import.meta.dirname, 'public/version.json');
        let data: Record<string, any> = {};
        if (fs.existsSync(versionPath)) {
          try {
            data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
          } catch {}
        }
        data.appVersion = pkg.version || '0.1.0';
        data.buildTime = buildTime;
        data.entryJs = entryJs;
        data.appAssets = Array.from(assets);
        if (!data.dbVersion) {
          data.dbVersion = 'initial';
        }

        const content = JSON.stringify(data, null, 2);
        fs.writeFileSync(versionPath, content);

        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: content
        });
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
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __APP_VERSION__: JSON.stringify(pkg.version || '0.1.0')
  }
});

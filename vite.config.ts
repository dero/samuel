import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const buildTime = Date.now();

export default defineConfig({
  plugins: [
    svelte(),
    {
      name: 'update-version-json',
      buildStart() {
        const versionPath = path.resolve(import.meta.dirname, 'public/version.json');
        let data: Record<string, any> = {};
        if (fs.existsSync(versionPath)) {
          try {
            data = JSON.parse(fs.readFileSync(versionPath, 'utf-8'));
          } catch {}
        }
        data.appVersion = pkg.version || '0.1.0';
        data.buildTime = buildTime;
        if (!data.dbVersion) {
          data.dbVersion = 'initial';
        }
        fs.writeFileSync(versionPath, JSON.stringify(data, null, 2));
      }
    }
  ],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __APP_VERSION__: JSON.stringify(pkg.version || '0.1.0')
  }
});

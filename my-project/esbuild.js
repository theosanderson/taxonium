import esbuild from 'esbuild';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import fs from 'fs/promises';
// remove the lib directory
await fs.rm('lib', { recursive: true, force: true });
esbuild
    .build({
        plugins: [NodeModulesPolyfillPlugin()],
        entryPoints: ['src/index.js'],
        outdir: 'lib',
        bundle: true,
        sourcemap: true,
        minify: true,
        splitting: true,
        format: 'esm',
        target: ['esnext'],
        bundle: true,
        
        loader: {
            ".png": "dataurl",
            ".woff": "dataurl",
            ".woff2": "dataurl",
            ".eot": "dataurl",
            ".ttf": "dataurl",
            ".svg": "dataurl",
        },
    })
    .catch(() => process.exit(1));
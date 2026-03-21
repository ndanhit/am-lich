import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

let env = {};
// Read from .env file (local dev)
if (fs.existsSync('.env')) {
    const envFile = fs.readFileSync('.env', 'utf-8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            env[`process.env.${match[1].trim()}`] = JSON.stringify(match[2].trim());
        }
    });
}
// Override with actual process.env (CI/Vercel — takes priority over .env file)
['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].forEach(key => {
    if (process.env[key]) {
        env[`process.env.${key}`] = JSON.stringify(process.env[key]);
    }
});

try {
    await esbuild.build({
        entryPoints: ['src/ui/views/app.ts'],
        bundle: true,
        outfile: 'dist/app.bundle.js',
        format: 'iife',
        target: 'es2020',
        sourcemap: true,
        define: {
            ...env,
            'process.env': JSON.stringify({}),
        },
    });
    console.log('Build succeeded.');
} catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
}

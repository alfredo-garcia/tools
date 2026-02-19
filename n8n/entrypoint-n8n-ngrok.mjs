#!/usr/bin/env node
import { execFileSync } from 'child_process';
import http from 'http';

async function main() {
  const useNgrok = process.env.USE_NGROK === '1';
  if (!useNgrok) {
    runCommand(process.argv.slice(2));
    return;
  }

  const host = process.env.NGROK_API_HOST || 'ngrok';
  const port = process.env.NGROK_API_PORT || '4040';
  const url = `http://${host}:${port}/api/tunnels`;

  console.log(`Waiting for ngrok API at ${host}:${port}...`);
  const publicUrl = await waitAndGetPublicUrl(url);
  if (!publicUrl) {
    console.error('Could not get ngrok public URL');
    process.exit(1);
  }
  process.env.WEBHOOK_URL = publicUrl;
  console.log('Using WEBHOOK_URL=' + publicUrl);
  runCommand(process.argv.slice(2));
}

function runCommand(args) {
  const cmd = args.length ? args : ['n8n', 'start'];
  execFileSync(cmd[0], cmd.slice(1), { stdio: 'inherit', env: process.env });
}

function waitAndGetPublicUrl(apiUrl) {
  return new Promise((resolve) => {
    function fetch() {
      const req = http.get(apiUrl, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            const tunnels = data.tunnels || [];
            const https = tunnels.find((t) => t.proto === 'https');
            const url = (https && https.public_url) || (tunnels[0] && tunnels[0].public_url);
            resolve(url || null);
          } catch {
            retry();
          }
        });
      });
      req.on('error', retry);
    }
    function retry() {
      setTimeout(fetch, 1000);
    }
    fetch();
  });
}

main();

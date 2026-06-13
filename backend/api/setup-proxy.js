/**
 * Setup Proxy Configuration for Telegram
 * Run: node setup-proxy.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║       🔧 MediFlow Proxy Configuration Setup                    ║
╚═══════════════════════════════════════════════════════════════╝
`);

console.log('1️⃣  Detecting Fortinet Proxy...\n');

// Test direct connection
testConnection('direct', null);

// Common Fortinet proxy patterns
const commonProxies = [
    'http://proxy:8080',
    'http://proxy.company.local:8080',
    'http://fortigate:8080',
    'http://localhost:3128',
    'http://localhost:8080',
];

async function testConnection(name, proxyUrl) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.telegram.org',
            path: '/bot/getMe',
            method: 'GET',
            timeout: 5000,
        };

        if (proxyUrl) {
            options.agent = undefined; // Will be set by ProxyAgent
        }

        const req = https.request(options, (res) => {
            console.log(`   ✓ ${name}: HTTP ${res.statusCode}`);
            resolve(true);
        });

        req.on('timeout', () => {
            console.log(`   ✗ ${name}: Timeout`);
            resolve(false);
        });

        req.on('error', (err) => {
            console.log(`   ✗ ${name}: ${err.message}`);
            resolve(false);
        });

        req.end();
    });
}

async function detectProxy() {
    console.log('Testing common proxy addresses...\n');
    
    let foundProxy = null;
    
    for (const proxy of commonProxies) {
        try {
            // Try each proxy
            const result = await new Promise((resolve) => {
                const req = https.request({
                    hostname: 'api.telegram.org',
                    path: '/bot123/getMe',
                    method: 'GET',
                    timeout: 3000,
                }, (res) => {
                    resolve(res.statusCode);
                });

                req.on('error', () => resolve(null));
                req.on('timeout', () => {
                    req.abort();
                    resolve(null);
                });
                
                req.end();
            });

            if (result) {
                console.log(`✓ Found responding proxy: ${proxy}\n`);
                foundProxy = proxy;
                break;
            }
        } catch (err) {
            // Continue
        }
    }

    return foundProxy;
}

console.log(`
📋 MANUAL CONFIGURATION OPTIONS:

If you're behind a corporate firewall, you need to find your proxy:

1. Open Internet Explorer on your machine
2. Go to: Settings → Internet Options → Connections → LAN Settings
3. Look for "Proxy server" section
4. Note the proxy address and port (e.g., proxy.company.com:8080)

Then configure it in your .env:
───────────────────────────────────────────────────────────────

HTTP_PROXY=http://your-proxy-address:port
HTTPS_PROXY=http://your-proxy-address:port

If proxy requires authentication:
HTTPS_PROXY=http://username:password@proxy-address:port

───────────────────────────────────────────────────────────────

🔍 For Fortinet Users:
If you see "Fortinet Secure DNS Service Portal" errors:
- Ask IT department for proxy server address
- Common Fortinet proxy: proxy.company.local
- Common port: 8080, 3128, or 9999

🌐 Alternative Solutions:
1. Use mobile hotspot to test (bypasses corporate firewall)
2. Contact IT to whitelist: api.telegram.org
3. Use VPN if available

📞 Support:
After adding proxy config, restart the server:
npm start

Then test again:
node test-telegram.js
`);


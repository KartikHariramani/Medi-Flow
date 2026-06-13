/**
 * Automatic Windows Proxy Detector
 * Detects proxy settings from Windows Registry and IE settings
 * Run: node auto-detect-proxy.js
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║   🔍 Automatic Windows Proxy Detection & Configuration        ║
╚═══════════════════════════════════════════════════════════════╝
`);

async function detectWindowsProxy() {
    try {
        console.log('🔍 Detecting Windows proxy settings from registry...\n');
        
        // Query Windows Registry for proxy settings
        const { stdout } = await execAsync(
            'reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer',
            { encoding: 'utf-8' }
        );
        
        // Parse the output
        const match = stdout.match(/ProxyServer\s+REG_SZ\s+(.*)/);
        if (match) {
            const proxyStr = match[1].trim();
            console.log(`✅ Found proxy in Windows Registry:\n   ${proxyStr}\n`);
            return proxyStr;
        }
    } catch (err) {
        console.log('ℹ️  No proxy found in Windows Registry\n');
    }

    try {
        console.log('🔍 Checking Internet Explorer settings...\n');
        
        // Try to detect from IE proxy auto-config
        const { stdout } = await execAsync(
            'reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v AutoConfigURL',
            { encoding: 'utf-8' }
        );
        
        const match = stdout.match(/AutoConfigURL\s+REG_SZ\s+(.*)/);
        if (match) {
            console.log(`✅ Found PAC (Proxy Auto-Config):\n   ${match[1].trim()}\n`);
            console.log('⚠️  note: Manual proxy entry needed (auto-config PAC not supported directly)\n');
        }
    } catch (err) {
        // Continue
    }

    return null;
}

async function updateEnvFile(proxyUrl) {
    try {
        let content = fs.readFileSync(envPath, 'utf-8');
        
        // Update HTTP_PROXY
        content = content.replace(
            /HTTP_PROXY=.*/,
            `HTTP_PROXY=${proxyUrl}`
        );
        
        // Update HTTPS_PROXY
        content = content.replace(
            /HTTPS_PROXY=.*/,
            `HTTPS_PROXY=${proxyUrl}`
        );
        
        fs.writeFileSync(envPath, content);
        console.log('✅ Updated .env file with proxy configuration\n');
        return true;
    } catch (err) {
        console.error('❌ Failed to update .env:', err.message);
        return false;
    }
}

async function main() {
    const proxy = await detectWindowsProxy();
    
    if (proxy) {
        const proxyUrl = `http://${proxy}`;
        console.log(`📝 Would you like to configure the detected proxy?\n`);
        console.log(`   Proxy: ${proxyUrl}`);
        console.log(`\n   To use this proxy, add to your .env:\n`);
        console.log(`   HTTPS_PROXY=${proxyUrl}\n`);
        console.log(`   Then restart the backend server.\n`);
    } else {
        console.log(`❌ Could not automatically detect proxy.\n`);
        console.log(`📋 Manual Setup:\n`);
        console.log(`   1. Open Internet Explorer`);
        console.log(`   2. Settings → Internet Options → Connections → LAN Settings`);
        console.log(`   3. Copy your proxy address`);
        console.log(`   4. Edit .env and set:\n`);
        console.log(`      HTTPS_PROXY=http://your-proxy:port\n`);
        console.log(`   5. Restart backend: npm start\n`);
    }

    console.log(`✨ After configuring proxy, test with:\n`);
    console.log(`   npm start     # Start backend`);
    console.log(`   node test-telegram.js  # Test connection\n`);
}

main().catch(err => console.error('Error:', err.message));

import { spawn, execSync, ChildProcess } from 'node:child_process';
import http from 'node:http';

/**
 * Helper to fetch the ngrok public URL from its local API.
 */
async function getNgrokUrl(): Promise<string> {
    const maxRetries = 20;
    const delay = 1000; // 1 second

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch('http://127.0.0.1:4040/api/tunnels');
            if (response.ok) {
                const data = await response.json() as { tunnels: { public_url: string }[] };
                const tunnel = data.tunnels.find(t => t.public_url.startsWith('https'));
                if (tunnel) {
                    return tunnel.public_url;
                }
            }
        } catch (error) {
            // Ignore connection errors and retry
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error('Could not retrieve ngrok URL after multiple attempts.');
}

/**
 * Helper to spawn a child process and pipe its output.
 */
function spawnProcess(command: string, args: string[], name: string, options: any = {}): ChildProcess {
    const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, FORCE_COLOR: 'true' },
        ...options
    });

    child.on('error', (err) => {
        console.error(`❌ [${name}] Error:`, err);
    });

    child.on('exit', (code) => {
        if (code !== 0 && code !== null) {
            console.error(`❌ [${name}] Exited with code ${code}`);
        }
    });

    return child;
}

async function main() {
    console.log('🚀 Starting Development Environment...');

    // 1. Start dev-gateway
    console.log('Starting dev-gateway...');
    const gatewayProcess = spawnProcess('npx', ['tsx', 'scripts/dev-gateway.ts'], 'Gateway');

    // 2. Start ngrok
    console.log('Starting ngrok...');
    // Use 'ignore' for stdin/stdout to prevent TUI, but keep stderr for errors
    const ngrokProcess = spawnProcess('ngrok', ['http', '3000', '--log=stdout'], 'ngrok', { stdio: ['ignore', 'ignore', 'inherit'] });

    try {
        // 3. Get ngrok URL
        console.log('Waiting for ngrok URL...');
        const webhookUrl = await getNgrokUrl();
        console.log(`✅ ngrok URL: ${webhookUrl}`);

        // 4. Update Webhook
        console.log('Updating Telegram Webhook...');
        try {
            execSync(`BOT_ENV=dev WEBHOOK_URL=${webhookUrl} npx tsx scripts/setWebhook.ts`, { stdio: 'inherit' });
            console.log('✅ Webhook updated successfully.');
        } catch (err) {
            console.error('❌ Failed to update webhook.');
            // We don't exit here, so the dev server keeps running even if webhook update fails
        }

    } catch (err) {
        console.error('❌ Error during startup:', err);
        // Clean up and exit
        gatewayProcess.kill();
        ngrokProcess.kill();
        process.exit(1);
    }

    // Handle cleanup on exit
    const cleanup = () => {
        console.log('\n🛑 Shutting down...');
        gatewayProcess.kill();
        ngrokProcess.kill();
        process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
}

main();

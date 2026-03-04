import "dotenv/config";

// BOT_ENV must be one of: dev | staging | prod
const BOT_ENV = process.env.BOT_ENV || "dev";

// Token map — set these in your .env or secrets manager
const TOKENS: Record<string, string | undefined> = {
    dev: process.env.TELEGRAM_BOT_TOKEN_DEV,
    staging: process.env.TELEGRAM_BOT_TOKEN_STAGING,
    prod: process.env.TELEGRAM_BOT_TOKEN_PROD,
};

const TOKEN = TOKENS[BOT_ENV];

if (!TOKEN) {
    console.error(`❌ Telegram token for BOT_ENV="${BOT_ENV}" not found!
Please set TELEGRAM_BOT_TOKEN_${BOT_ENV.toUpperCase()}`);
    process.exit(1);
}

// Map environments → Worker domains
const WEBHOOKS: Record<string, string> = {
    dev: "https://aa35-109-87-26-199.ngrok-free.app",
    staging: "https://dnd-studio-bot-staging.dmytro-horban01.workers.dev",
    prod: "https://dnd-studio-bot-production.dmytro-horban01.workers.dev",
};

const url = process.env.WEBHOOK_URL || WEBHOOKS[BOT_ENV];
if (!url) {
    console.error(`❌ Unknown BOT_ENV "${BOT_ENV}". Use dev | staging | prod`);
    process.exit(1);
}

async function main() {
    console.log(`🤖 BOT_ENV=${BOT_ENV}`);
    console.log(`🔗 Setting webhook: ${url}`);

    let res = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url + "/bot/webhook" }),
    });
    console.log("setWebhook:", await res.json());

    res = await fetch(`https://api.telegram.org/bot${TOKEN}/getWebhookInfo`);
    console.log("getWebhookInfo:", await res.json());

    if (BOT_ENV === "dev") {
        console.log(`🔗 Setting chat menu button: ${url}`);
        res = await fetch(`https://api.telegram.org/bot${TOKEN}/setChatMenuButton`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                menu_button: {
                    type: "web_app",
                    text: "Гільдія",
                    web_app: { url },
                },
            }),
        });
        console.log("setChatMenuButton:", await res.json());
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});

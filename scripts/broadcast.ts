import * as fs from "node:fs";
import * as path from "node:path";
import "dotenv/config";

// Environment setup (dev | staging | prod)
const BOT_ENV = process.env.BOT_ENV || "dev";
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN || "dummy_token";

// Parse command line arguments or env vars for single user targeting
let onlyMemberId: string | null = process.env.ONLY_MEMBER_ID || process.env.ONLY_USER_ID || null;
for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--member-id" || process.argv[i] === "--user-id") {
        onlyMemberId = process.argv[i + 1] || null;
        i++;
    } else if (process.argv[i].startsWith("--member-id=")) {
        onlyMemberId = process.argv[i].split("=")[1] || null;
    } else if (process.argv[i].startsWith("--user-id=")) {
        onlyMemberId = process.argv[i].split("=")[1] || null;
    }
}

const API_URLS: Record<string, string> = {
    dev: process.env.API_URL || "http://localhost:8787",
    staging: "https://dnd-studio-api-staging.dmytro-horban01.workers.dev",
    prod: "https://dnd-studio-api-production.dmytro-horban01.workers.dev",
};

const API_BASE_URL = API_URLS[BOT_ENV];
if (!API_BASE_URL) {
    console.error(`❌ Unknown BOT_ENV "${BOT_ENV}". Use dev | staging | prod`);
    process.exit(1);
}

// Read release notes text (Markdown)
const releaseNotesPath = path.join(process.cwd(), "scripts", "release-notes.md");
if (!fs.existsSync(releaseNotesPath)) {
    console.error(`❌ Release notes file not found at ${releaseNotesPath}`);
    process.exit(1);
}
const releaseNotesText = fs.readFileSync(releaseNotesPath, "utf-8");

// Read screenshot URLs
const screenshotsPath = path.join(process.cwd(), "scripts", "screenshots.json");
let photoUrls: string[] = [];
if (fs.existsSync(screenshotsPath)) {
    try {
        photoUrls = JSON.parse(fs.readFileSync(screenshotsPath, "utf-8"));
    } catch (e: any) {
        console.warn(`⚠️ Warning: Failed to parse screenshots.json: ${e.message}. Proceeding with no photos.`);
    }
}

// Helper for waiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    console.log(`🚀 Starting Release Notes Broadcast`);
    console.log(`   Environment: ${BOT_ENV}`);
    console.log(`   API URL:     ${API_BASE_URL}`);
    console.log(`   Photos count: ${photoUrls.length}`);
    if (onlyMemberId) {
        console.log(`   Target User: ${onlyMemberId}`);
    }
    console.log(`-----------------------------------------------`);

    const headers = {
        "content-type": "application/json",
        "authorization": `Bearer ${INTERNAL_TOKEN}`,
    };

    // Step 1: Fetch broadcast recipients from API
    let recipients: any[] = [];
    if (onlyMemberId) {
        console.log(`📥 Fetching recipient details for member ID ${onlyMemberId}...`);
        try {
            const response = await fetch(`${API_BASE_URL}/members/${onlyMemberId}`, {
                method: "GET",
                headers,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API returned ${response.status}: ${errText}`);
            }

            const resBody = (await response.json()) as { ok: boolean; data: any };
            if (!resBody.ok || !resBody.data) {
                throw new Error(`Member not found or invalid response: ${JSON.stringify(resBody)}`);
            }

            const member = resBody.data;
            if (!member.telegramUserId) {
                console.error(`❌ Member ${onlyMemberId} does not have a Telegram User ID. Cannot broadcast.`);
                process.exit(1);
            }

            recipients = [member];
        } catch (error: any) {
            console.error(`❌ Failed to retrieve recipient: ${error.message}`);
            process.exit(1);
        }
    } else {
        console.log("📥 Fetching broadcast recipients...");
        try {
            const response = await fetch(`${API_BASE_URL}/members/broadcast-recipients`, {
                method: "GET",
                headers,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API returned ${response.status}: ${errText}`);
            }

            const resBody = (await response.json()) as { ok: boolean; data: any[] };
            if (!resBody.ok || !Array.isArray(resBody.data)) {
                throw new Error(`Unexpected API response structure: ${JSON.stringify(resBody)}`);
            }

            recipients = resBody.data;
        } catch (error: any) {
            console.error(`❌ Failed to retrieve recipients: ${error.message}`);
            process.exit(1);
        }
    }

    const totalCount = recipients.length;
    console.log(`✅ Found ${totalCount} active users with Telegram IDs.`);
    if (totalCount === 0) {
        console.log("No recipients found. Exiting.");
        process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;
    const failedUsers: any[] = [];

    // Step 2: Iterate over recipients and dispatch messages
    for (let i = 0; i < totalCount; i++) {
        const recipient = recipients[i];
        const { telegramUserId, firstName, nickname } = recipient;
        const displayName = nickname || firstName || telegramUserId;

        console.log(`[${i + 1}/${totalCount}] Sending to ${displayName} (${telegramUserId})...`);

        const payload = {
            telegramUserId,
            text: releaseNotesText,
            photoUrls,
        };

        const attemptSend = async (): Promise<{ ok: boolean; photosSent?: number; warnings?: string[] }> => {
            const response = await fetch(`${API_BASE_URL}/members/send-broadcast`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Status ${response.status}: ${text}`);
            }
            return (await response.json()) as { ok: boolean; photosSent?: number; warnings?: string[] };
        };

        let result: { ok: boolean; photosSent?: number; warnings?: string[] } | null = null;
        try {
            result = await attemptSend();
        } catch (err: any) {
            console.warn(`   ⚠️ Attempt 1 failed for ${displayName}: ${err.message}. Retrying in 500ms...`);
            await delay(500);
            try {
                result = await attemptSend();
            } catch (retryErr: any) {
                console.error(`   ❌ Attempt 2 (retry) failed: ${retryErr.message}`);
            }
        }

        if (result && result.ok) {
            successCount++;
            const photosInfo = result.photosSent !== undefined ? `with ${result.photosSent} photos` : "sent";
            console.log(`   ✅ Sent successfully (${photosInfo}).`);
            if (result.warnings && result.warnings.length > 0) {
                result.warnings.forEach(w => console.log(`      ⚠️ Warning: ${w}`));
            }
        } else {
            failCount++;
            failedUsers.push({ telegramUserId, displayName });
        }

        // Rate limit: 100ms between calls
        if (i < totalCount - 1) {
            await delay(100);
        }
    }

    // Print summary report
    console.log(`\n===============================================`);
    console.log(`📢 Broadcast Summary Report`);
    console.log(`===============================================`);
    console.log(`Total Target Users:  ${totalCount}`);
    console.log(`Successful Sends:    ${successCount}`);
    console.log(`Failed Sends:        ${failCount}`);
    console.log(`===============================================`);

    if (failedUsers.length > 0) {
        console.log(`❌ Failed User IDs:`);
        failedUsers.forEach((u) => {
            console.log(` - ${u.displayName} (${u.telegramUserId})`);
        });
    } else {
        console.log(`🎉 All broadcasts completed successfully!`);
    }
}

main().catch((err) => {
    console.error("❌ Fatal broadcast error:", err);
    process.exit(1);
});

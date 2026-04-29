import CryptoJS from "crypto-js";

/**
 * Generates an encrypted QR code payload string.
 * This ensures the QR payload is identical between the API (for the Mini App)
 * and the Bot.
 * 
 * @param memberId The UUID of the member.
 * @param qrSecret The QR_SECRET_KEY from environment variables.
 * @returns A JSON string representing the QR code payload.
 */
export function generateMemberQrPayload(memberId: string, qrSecret: string): string {
    const payloadJson = JSON.stringify({ memberId });
    const encryptedPayload = CryptoJS.AES.encrypt(payloadJson, qrSecret).toString();
    return JSON.stringify({ type: "member", payload: encryptedPayload });
}

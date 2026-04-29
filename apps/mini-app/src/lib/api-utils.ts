import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BE_HOST || 'http://192.168.50.108:8787/'
});

/**
 * Helper to retry a function with exponential backoff on 401 errors.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 100
): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            // Only retry on 5xx Server Errors (retrying 401 is usually pointless)
            if (err.response?.status >= 500 && i < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, i);
                console.warn(`[API] Server Error ${err.response.status}. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw err;
        }
    }
    throw lastError;
}

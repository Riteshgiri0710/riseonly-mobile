/**
 * Offline mock cache for testing without backend.
 *
 * Export: Debugger → Mock → "Export full mock" → copy the object and paste
 * into MOCK_CACHE below (replace {} or extend).
 *
 * Import: Debugger → Mock → "Load from config" — merge:
 * - keys from MOCK_CACHE overwrite/are added to ws_mock_ and mockCache;
 * - local mocks (ws_mock_*) that are not in MOCK_CACHE are not removed.
 *
 * This allows sharing mocks: one exports, commits; others pull and
 * click "Load from config" for offline testing.
 */
export const MOCK_CACHE: Record<string, { timestamp: number; data: any; }> = {};
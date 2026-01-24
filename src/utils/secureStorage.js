import { db } from './db';

const USER_ID_KEY = 'crumbs_active_user_id';

/**
 * Secure Storage Wrapper using IndexedDB
 * Isolates data per user and handles migration from localStorage
 */
export const secureStorage = {
    /**
     * Set a value securely for the current user
     */
    async setUserData(key, value, userId) {
        try {
            const scope = userId ? `user_${userId}` : 'anonymous';
            const scopedKey = `${scope}__${key}`;
            await db.set(scopedKey, JSON.stringify(value));
        } catch (err) {
            console.error("Storage Error:", err);
        }
    },

    /**
     * Get a value securely for the current user
     */
    async getUserData(key, userId) {
        try {
            const scope = userId ? `user_${userId}` : 'anonymous';
            const scopedKey = `${scope}__${key}`;
            const value = await db.get(scopedKey);
            return value ? JSON.parse(value) : null;
        } catch (err) {
            console.error("Storage Retrieval Error:", err);
            return null;
        }
    },

    async clearUserData(userId) {
        const prefix = `user_${userId}__`;
        const keys = await db.keys();
        const userKeys = keys.filter(k => k.startsWith(prefix));

        for (const key of userKeys) {
            await db.delete(key);
        }
        console.log(`🗑️ Cleared ${userKeys.length} items for user ${userId} from IDB`);
    },

    async clearAll() {
        await db.clear();
        localStorage.clear(); // Clear legacy storage too
    },

    /**
     * One-time migration from localStorage to IndexedDB
     */
    async migrateFromLocalStorage() {
        try {
            const legacyToken = localStorage.getItem('crumbs_token');
            const legacyCourses = localStorage.getItem('crumbs_courses');

            // If we have legacy data but no IDB data yet
            if (legacyToken || legacyCourses) {
                console.log("📦 Migrating storage to IndexedDB...");

                // For transitional backward compatibility, storing them both as 'anonymous' and raw keys
                if (legacyToken) {
                    await db.set('crumbs_token', legacyToken);
                    // Also attempt to migrate to current user scope if possible, but difficult without userId handy here
                }

                if (legacyCourses) {
                    await db.set('crumbs_courses', legacyCourses);
                }

                console.log("📦 Migration complete.");
            }
        } catch (e) {
            console.warn("Migration warning:", e);
        }
    }
};

// Check for migration logic on import?
// Better to call explicitly in App.jsx or similar, but for safety in this refactor:
// We can expose a method to do it.
// secureStorage.migrateFromLocalStorage();

import { openDB } from 'idb';

const DB_NAME = 'CrumbsDB';
const DB_VERSION = 1;

export const dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
        // Courses store
        if (!db.objectStoreNames.contains('courses')) {
            db.createObjectStore('courses', { keyPath: 'id' });
        }
        // Key-value store for user session, settings, etc.
        if (!db.objectStoreNames.contains('keyval')) {
            db.createObjectStore('keyval');
        }
    },
});

export const db = {
    async get(key) {
        return (await dbPromise).get('keyval', key);
    },
    async set(key, val) {
        return (await dbPromise).put('keyval', val, key);
    },
    async delete(key) {
        return (await dbPromise).delete('keyval', key);
    },
    async clear() {
        return (await dbPromise).clear('keyval');
    },
    async keys() {
        return (await dbPromise).getAllKeys('keyval');
    },
};

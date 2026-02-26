export interface PendingShop {
    id?: string; // Local ID for IndexedDB
    formData: {
        name: string;
        ownerName: string;
        contactNumber: string;
        paymentMethod: string;
        avgBillValue: string;
        routeId: string;
        latitude: string;
        longitude: string;
        paymentStatus: string;
        creditPeriod: string | null;
    };
    imageBlob: Blob | null;
    timestamp: number;
}

const DB_NAME = 'ShopMapperOffline';
const STORE_NAME = 'pendingShops';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function savePendingShop(shop: Omit<PendingShop, 'id' | 'timestamp'>): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const data: PendingShop = {
            ...shop,
            timestamp: Date.now()
        };
        const request = store.add(data);

        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
}

export async function getPendingShops(): Promise<PendingShop[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function deletePendingShop(id: number): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function hasPendingShops(): Promise<boolean> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();

        request.onsuccess = () => resolve(request.result > 0);
        request.onerror = () => reject(request.error);
    });
}

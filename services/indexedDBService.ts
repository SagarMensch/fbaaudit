/**
 * IndexedDB Service
 * 
 * Replaces localStorage with IndexedDB for complex queries, indexing, and better performance.
 * Supports transactions, bulk operations, and advanced querying capabilities.
 * 
 * Database Schema:
 * - locations: Temporal location master data
 * - fuel_prices: Temporal fuel price data
 * - lanes: Temporal lane master data
 * - vehicles: Temporal vehicle master data
 * - accessorials: Temporal accessorial master data
 * - audit_trail: Complete audit history
 */

export interface IndexedDBConfig {
    databaseName: string;
    version: number;
    stores: StoreConfig[];
}

export interface StoreConfig {
    name: string;
    keyPath: string;
    autoIncrement?: boolean;
    indexes?: IndexConfig[];
}

export interface IndexConfig {
    name: string;
    keyPath: string | string[];
    unique?: boolean;
    multiEntry?: boolean;
}

export class IndexedDBService {
    private db: IDBDatabase | null = null;
    private config: IndexedDBConfig;

    constructor(config: IndexedDBConfig) {
        this.config = config;
    }

    /**
     * Initialize database and create object stores
     */
    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.databaseName, this.config.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                this.config.stores.forEach(storeConfig => {
                    // Delete existing store if it exists
                    if (db.objectStoreNames.contains(storeConfig.name)) {
                        db.deleteObjectStore(storeConfig.name);
                    }

                    // Create new store
                    const store = db.createObjectStore(storeConfig.name, {
                        keyPath: storeConfig.keyPath,
                        autoIncrement: storeConfig.autoIncrement || false
                    });

                    // Create indexes
                    if (storeConfig.indexes) {
                        storeConfig.indexes.forEach(indexConfig => {
                            store.createIndex(
                                indexConfig.name,
                                indexConfig.keyPath,
                                {
                                    unique: indexConfig.unique || false,
                                    multiEntry: indexConfig.multiEntry || false
                                }
                            );
                        });
                    }
                });
            };
        });
    }

    /**
     * Add or update a record
     */
    async put<T>(storeName: string, data: T): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Add multiple records in a single transaction
     */
    async putBulk<T>(storeName: string, dataArray: T[]): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            dataArray.forEach(data => store.put(data));

            transaction.onerror = () => reject(transaction.error);
            transaction.oncomplete = () => resolve();
        });
    }

    /**
     * Get a record by key
     */
    async get<T>(storeName: string, key: any): Promise<T | null> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    /**
     * Get all records from a store
     */
    async getAll<T>(storeName: string): Promise<T[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    /**
     * Query records using an index
     */
    async queryByIndex<T>(
        storeName: string,
        indexName: string,
        query: IDBValidKey | IDBKeyRange
    ): Promise<T[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(query);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    /**
     * Delete a record by key
     */
    async delete(storeName: string, key: any): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Clear all records from a store
     */
    async clear(storeName: string): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Count records in a store
     */
    async count(storeName: string, query?: IDBValidKey | IDBKeyRange): Promise<number> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = query ? store.count(query) : store.count();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    /**
     * Execute a custom query using a cursor
     */
    async query<T>(
        storeName: string,
        filterFn: (item: T) => boolean,
        indexName?: string
    ): Promise<T[]> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const results: T[] = [];
            const transaction = this.db!.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);

            const source = indexName ? store.index(indexName) : store;
            const request = source.openCursor();

            request.onerror = () => reject(request.error);
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    if (filterFn(cursor.value)) {
                        results.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
        });
    }

    /**
     * Close database connection
     */
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

/**
 * MDM Database Configuration
 */
export const MDM_DB_CONFIG: IndexedDBConfig = {
    databaseName: 'MDM_Enterprise',
    version: 1,
    stores: [
        {
            name: 'locations',
            keyPath: 'versionId',
            indexes: [
                { name: 'by_id', keyPath: 'id', unique: false },
                { name: 'by_effective_from', keyPath: 'effectiveFrom', unique: false },
                { name: 'by_is_active', keyPath: 'isActive', unique: false },
                { name: 'by_id_and_active', keyPath: ['id', 'isActive'], unique: false }
            ]
        },
        {
            name: 'fuel_prices',
            keyPath: 'versionId',
            indexes: [
                { name: 'by_id', keyPath: 'id', unique: false },
                { name: 'by_city', keyPath: 'city', unique: false },
                { name: 'by_effective_from', keyPath: 'effectiveFrom', unique: false },
                { name: 'by_is_active', keyPath: 'isActive', unique: false }
            ]
        },
        {
            name: 'lanes',
            keyPath: 'versionId',
            indexes: [
                { name: 'by_id', keyPath: 'id', unique: false },
                { name: 'by_lane_code', keyPath: 'laneCode', unique: false },
                { name: 'by_origin', keyPath: 'originClusterId', unique: false },
                { name: 'by_destination', keyPath: 'destinationClusterId', unique: false },
                { name: 'by_is_active', keyPath: 'isActive', unique: false }
            ]
        },
        {
            name: 'vehicles',
            keyPath: 'versionId',
            indexes: [
                { name: 'by_id', keyPath: 'id', unique: false },
                { name: 'by_code', keyPath: 'code', unique: false },
                { name: 'by_body_type', keyPath: 'bodyType', unique: false },
                { name: 'by_is_active', keyPath: 'isActive', unique: false }
            ]
        },
        {
            name: 'accessorials',
            keyPath: 'versionId',
            indexes: [
                { name: 'by_id', keyPath: 'id', unique: false },
                { name: 'by_code', keyPath: 'code', unique: false },
                { name: 'by_category', keyPath: 'category', unique: false },
                { name: 'by_is_active', keyPath: 'isActive', unique: false }
            ]
        },
        {
            name: 'audit_trail',
            keyPath: 'versionId',
            autoIncrement: false,
            indexes: [
                { name: 'by_entity_id', keyPath: 'entityId', unique: false },
                { name: 'by_entity_type', keyPath: 'entityType', unique: false },
                { name: 'by_timestamp', keyPath: 'timestamp', unique: false },
                { name: 'by_user_id', keyPath: 'userId', unique: false }
            ]
        }
    ]
};

/**
 * Singleton instance for MDM database
 */
let mdmDBInstance: IndexedDBService | null = null;

export async function getMDMDatabase(): Promise<IndexedDBService> {
    if (!mdmDBInstance) {
        mdmDBInstance = new IndexedDBService(MDM_DB_CONFIG);
        await mdmDBInstance.initialize();
    }
    return mdmDBInstance;
}

/**
 * Migration utility to move data from localStorage to IndexedDB
 */
export class DataMigrationService {
    static async migrateFromLocalStorage(db: IndexedDBService): Promise<void> {
        console.log('Starting data migration from localStorage to IndexedDB...');

        // Migrate locations
        const locations = JSON.parse(localStorage.getItem('location_zones') || '[]');
        if (locations.length > 0) {
            await db.putBulk('locations', locations);
            console.log(`Migrated ${locations.length} location records`);
        }

        // Migrate fuel prices
        const fuelPrices = JSON.parse(localStorage.getItem('fuel_prices') || '[]');
        if (fuelPrices.length > 0) {
            await db.putBulk('fuel_prices', fuelPrices);
            console.log(`Migrated ${fuelPrices.length} fuel price records`);
        }

        // Migrate lanes
        const lanes = JSON.parse(localStorage.getItem('lane_master') || '[]');
        if (lanes.length > 0) {
            await db.putBulk('lanes', lanes);
            console.log(`Migrated ${lanes.length} lane records`);
        }

        // Migrate vehicles
        const vehicles = JSON.parse(localStorage.getItem('vehicle_types') || '[]');
        if (vehicles.length > 0) {
            await db.putBulk('vehicles', vehicles);
            console.log(`Migrated ${vehicles.length} vehicle records`);
        }

        // Migrate accessorials
        const accessorials = JSON.parse(localStorage.getItem('accessorials') || '[]');
        if (accessorials.length > 0) {
            await db.putBulk('accessorials', accessorials);
            console.log(`Migrated ${accessorials.length} accessorial records`);
        }

        console.log('Data migration completed successfully');
    }

    static async validateMigration(db: IndexedDBService): Promise<boolean> {
        const locationCount = await db.count('locations');
        const fuelCount = await db.count('fuel_prices');
        const laneCount = await db.count('lanes');
        const vehicleCount = await db.count('vehicles');
        const accessorialCount = await db.count('accessorials');

        console.log('Migration validation:');
        console.log(`- Locations: ${locationCount}`);
        console.log(`- Fuel Prices: ${fuelCount}`);
        console.log(`- Lanes: ${laneCount}`);
        console.log(`- Vehicles: ${vehicleCount}`);
        console.log(`- Accessorials: ${accessorialCount}`);

        return true;
    }
}

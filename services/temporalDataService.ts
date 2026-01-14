/**
 * Temporal Data Service - Base Class
 * 
 * Provides temporal versioning capabilities for all master data entities.
 * Implements "never delete, only expire" principle with complete audit trail.
 * 
 * Key Features:
 * - Version management with effectiveFrom/effectiveTo timestamps
 * - Point-in-time queries to retrieve historical state
 * - Automatic audit trail generation
 * - Version conflict resolution
 * - Bulk version operations
 */

export interface TemporalEntity {
    id: string;
    versionId: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    createdBy: string;
    createdAt: Date;
    modifiedBy: string;
    modifiedAt: Date;
    changeReason?: string;
    isActive: boolean;
}

export interface AuditTrailEntry {
    versionId: string;
    entityId: string;
    entityType: string;
    action: 'CREATE' | 'UPDATE' | 'EXPIRE' | 'RESTORE';
    timestamp: Date;
    userId: string;
    userName: string;
    changeReason: string;
    beforeState: any;
    afterState: any;
}

export interface VersionQuery {
    entityId?: string;
    effectiveDate?: Date;
    includeExpired?: boolean;
    fromDate?: Date;
    toDate?: Date;
}

export class TemporalDataService<T extends TemporalEntity> {
    protected entityType: string;
    protected storeName: string;

    constructor(entityType: string, storeName: string) {
        this.entityType = entityType;
        this.storeName = storeName;
    }

    /**
     * Create a new version of an entity
     * Automatically expires previous version if exists
     */
    async createVersion(
        entityData: Omit<T, 'versionId' | 'effectiveFrom' | 'effectiveTo' | 'createdAt' | 'modifiedAt' | 'isActive' | 'createdBy' | 'modifiedBy'>,
        effectiveFrom: Date = new Date(),
        userId: string = 'SYSTEM',
        changeReason?: string
    ): Promise<T> {
        const versionId = this.generateVersionId();

        // Expire previous version if exists
        if (entityData.id) {
            await this.expireCurrentVersion(entityData.id, effectiveFrom, userId);
        }

        const newVersion: T = {
            ...entityData,
            versionId,
            effectiveFrom,
            effectiveTo: null,
            createdAt: new Date(),
            modifiedAt: new Date(),
            createdBy: userId,
            modifiedBy: userId,
            changeReason,
            isActive: true
        } as T;

        // Store in IndexedDB
        await this.saveToStorage(newVersion);

        // Create audit trail entry
        await this.createAuditEntry({
            versionId,
            entityId: entityData.id,
            entityType: this.entityType,
            action: 'CREATE',
            timestamp: new Date(),
            userId,
            userName: userId, // TODO: Resolve from user service
            changeReason: changeReason || 'New version created',
            beforeState: null,
            afterState: newVersion
        });

        return newVersion;
    }

    /**
     * Expire the current active version
     */
    async expireVersion(
        entityId: string,
        effectiveTo: Date = new Date(),
        userId: string = 'SYSTEM',
        changeReason?: string
    ): Promise<void> {
        const currentVersion = await this.getCurrentVersion(entityId);

        if (!currentVersion) {
            throw new Error(`No active version found for entity ${entityId}`);
        }

        const expiredVersion = {
            ...currentVersion,
            effectiveTo,
            modifiedAt: new Date(),
            modifiedBy: userId,
            isActive: false
        };

        await this.saveToStorage(expiredVersion);

        await this.createAuditEntry({
            versionId: currentVersion.versionId,
            entityId,
            entityType: this.entityType,
            action: 'EXPIRE',
            timestamp: new Date(),
            userId,
            userName: userId,
            changeReason: changeReason || 'Version expired',
            beforeState: currentVersion,
            afterState: expiredVersion
        });
    }

    /**
     * Get current active version of an entity
     */
    async getCurrentVersion(entityId: string): Promise<T | null> {
        const versions = await this.getVersionHistory(entityId);
        return versions.find(v => v.isActive && v.effectiveTo === null) || null;
    }

    /**
     * Get version effective at a specific point in time
     */
    async getVersionAt(entityId: string, effectiveDate: Date): Promise<T | null> {
        const versions = await this.getVersionHistory(entityId);

        return versions.find(v =>
            v.effectiveFrom <= effectiveDate &&
            (v.effectiveTo === null || v.effectiveTo > effectiveDate)
        ) || null;
    }

    /**
     * Get complete version history for an entity
     */
    async getVersionHistory(entityId: string): Promise<T[]> {
        const allVersions = await this.getAllFromStorage();
        return allVersions
            .filter(v => v.id === entityId)
            .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
    }

    /**
     * Get all active entities at a specific point in time
     */
    async getAllActiveAt(effectiveDate: Date = new Date()): Promise<T[]> {
        const allVersions = await this.getAllFromStorage();
        const entityMap = new Map<string, T>();

        // Group by entity ID and find version active at effectiveDate
        allVersions.forEach(version => {
            if (
                version.effectiveFrom <= effectiveDate &&
                (version.effectiveTo === null || version.effectiveTo > effectiveDate)
            ) {
                entityMap.set(version.id, version);
            }
        });

        return Array.from(entityMap.values());
    }

    /**
     * Get audit trail for an entity
     */
    async getAuditTrail(entityId: string): Promise<AuditTrailEntry[]> {
        const auditKey = `audit_${this.entityType}`;
        const allAudits = JSON.parse(localStorage.getItem(auditKey) || '[]');

        return allAudits
            .filter((entry: AuditTrailEntry) => entry.entityId === entityId)
            .sort((a: AuditTrailEntry, b: AuditTrailEntry) =>
                b.timestamp.getTime() - a.timestamp.getTime()
            );
    }

    /**
     * Compare two versions and return differences
     */
    compareVersions(version1: T, version2: T): Record<string, { old: any; new: any }> {
        const differences: Record<string, { old: any; new: any }> = {};

        const keys = new Set([...Object.keys(version1), ...Object.keys(version2)]);

        keys.forEach(key => {
            if (key === 'versionId' || key === 'effectiveFrom' || key === 'effectiveTo' ||
                key === 'createdAt' || key === 'modifiedAt') {
                return; // Skip metadata fields
            }

            const val1 = (version1 as any)[key];
            const val2 = (version2 as any)[key];

            if (JSON.stringify(val1) !== JSON.stringify(val2)) {
                differences[key] = { old: val1, new: val2 };
            }
        });

        return differences;
    }

    /**
     * Restore an expired version (create new version with same data)
     */
    async restoreVersion(
        versionId: string,
        userId: string = 'SYSTEM',
        changeReason?: string
    ): Promise<T> {
        const versions = await this.getAllFromStorage();
        const versionToRestore = versions.find(v => v.versionId === versionId);

        if (!versionToRestore) {
            throw new Error(`Version ${versionId} not found`);
        }

        // Create new version with restored data
        const { versionId: _, effectiveFrom: __, effectiveTo: ___, ...restoreData } = versionToRestore;

        return await this.createVersion(
            restoreData as any,
            new Date(),
            userId,
            changeReason || `Restored from version ${versionId}`
        );
    }

    // Protected helper methods

    protected generateVersionId(): string {
        return `${this.entityType}_v${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    protected async expireCurrentVersion(
        entityId: string,
        effectiveTo: Date,
        userId: string
    ): Promise<void> {
        const currentVersion = await this.getCurrentVersion(entityId);
        if (currentVersion) {
            await this.expireVersion(entityId, effectiveTo, userId, 'Superseded by new version');
        }
    }

    protected async saveToStorage(entity: T): Promise<void> {
        // For now, use localStorage (will be replaced with IndexedDB)
        const key = `temporal_${this.storeName}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');

        // Remove old version with same versionId if exists
        const filtered = existing.filter((e: T) => e.versionId !== entity.versionId);
        filtered.push(this.serializeEntity(entity));

        localStorage.setItem(key, JSON.stringify(filtered));
    }

    protected async getAllFromStorage(): Promise<T[]> {
        const key = `temporal_${this.storeName}`;
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        return data.map((item: any) => this.deserializeEntity(item));
    }

    protected async createAuditEntry(entry: AuditTrailEntry): Promise<void> {
        const auditKey = `audit_${this.entityType}`;
        const existing = JSON.parse(localStorage.getItem(auditKey) || '[]');
        existing.push(entry);
        localStorage.setItem(auditKey, JSON.stringify(existing));
    }

    protected serializeEntity(entity: T): any {
        return {
            ...entity,
            effectiveFrom: entity.effectiveFrom.toISOString(),
            effectiveTo: entity.effectiveTo?.toISOString() || null,
            createdAt: entity.createdAt.toISOString(),
            modifiedAt: entity.modifiedAt.toISOString()
        };
    }

    protected deserializeEntity(data: any): T {
        return {
            ...data,
            effectiveFrom: new Date(data.effectiveFrom),
            effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
            createdAt: new Date(data.createdAt),
            modifiedAt: new Date(data.modifiedAt)
        } as T;
    }
}

/**
 * Utility functions for temporal queries
 */
export class TemporalQueryBuilder {
    static isActiveAt(entity: TemporalEntity, date: Date): boolean {
        return entity.effectiveFrom <= date &&
            (entity.effectiveTo === null || entity.effectiveTo > date);
    }

    static isCurrentlyActive(entity: TemporalEntity): boolean {
        return this.isActiveAt(entity, new Date());
    }

    static getOverlappingPeriod(entity1: TemporalEntity, entity2: TemporalEntity): { start: Date; end: Date | null } | null {
        const start = entity1.effectiveFrom > entity2.effectiveFrom ? entity1.effectiveFrom : entity2.effectiveFrom;

        const end1 = entity1.effectiveTo;
        const end2 = entity2.effectiveTo;

        let end: Date | null = null;
        if (end1 === null && end2 === null) {
            end = null;
        } else if (end1 === null) {
            end = end2;
        } else if (end2 === null) {
            end = end1;
        } else {
            end = end1 < end2 ? end1 : end2;
        }

        if (end !== null && start > end) {
            return null; // No overlap
        }

        return { start, end };
    }
}

export class StorageService {
    private static PREFIX = 'app_';

    static save(key: string, data: any): void {
        try {
            localStorage.setItem(`${this.PREFIX}${key}`, JSON.stringify(data));
        } catch (e) {
            console.error('Storage Save Error:', e);
        }
    }

    static load<T>(key: string, distinctDefault: T): T {
        try {
            const item = localStorage.getItem(`${this.PREFIX}${key}`);
            return item ? JSON.parse(item) : distinctDefault;
        } catch (e) {
            console.error('Storage Load Error:', e);
            return distinctDefault;
        }
    }

    static clear(): void {
        localStorage.clear();
        window.location.reload();
    }
}

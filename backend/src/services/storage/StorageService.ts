import { IStorageProvider } from './StorageProvider.interface';
import { LocalStorageProvider } from './LocalStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';

export class StorageService {
    private static instance: StorageService;
    private provider: IStorageProvider;

    private constructor() {
        this.provider = this.getProvider();
    }

    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    private getProvider(): IStorageProvider {
        const type = process.env.STORAGE_PROVIDER || 'local';

        switch (type.toLowerCase()) {
            case 's3':
                return new S3StorageProvider();
            case 'local':
            default:
                return new LocalStorageProvider();
        }
    }

    public getStorageProvider(): IStorageProvider {
        return this.provider;
    }
}

export default StorageService.getInstance();

import { HappStoreEntry } from '../types';
export declare const enableHapp: (client: any, happId: any) => Promise<any>;
export declare const disableHapp: (client: any, happId: any) => Promise<any>;
export declare const registerAsHost: (client: any) => Promise<any>;
export declare const SHIMS: {
    registerAsProvider: (client: any) => Promise<any>;
    createAndRegisterHapp: (client: any, entry: HappStoreEntry) => Promise<any>;
};

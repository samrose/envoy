import { HappID, HappStoreEntry } from '../types';
import * as Config from '../config';
declare type LookupHappRequest = {
    happId: string;
};
export declare type InstallHappRequest = {
    happId: HappID;
};
export declare type InstallHappResponse = void;
declare const _default: (masterClient: any, baseDir: any) => ({ happId }: InstallHappRequest) => Promise<void>;
export default _default;
export declare const installDnasAndUi: (client: any, baseDir: any, opts: {
    happId: string;
    properties?: any;
}) => Promise<void>;
export declare const installDna: (client: any, { hash, path, properties }: {
    hash: any;
    path: any;
    properties: any;
}) => Promise<any>;
/**
 * Just like `installDna`, but without the expected_hash
 */
export declare const installCoreDna: (client: any, { dnaId, path, properties }: {
    dnaId: any;
    path: any;
    properties: any;
}) => Promise<any>;
declare type SetupInstanceArgs = {
    instanceId: string;
    agentId: string;
    dnaId: string;
    conductorInterface: Config.ConductorInterface;
    replace?: string;
};
export declare const setupInstance: (client: any, { instanceId, agentId, dnaId, conductorInterface, replace }: SetupInstanceArgs) => Promise<any[] | {
    success: boolean;
}>;
export declare const setupHolofuelBridge: (client: any, { callerInstanceId, replace }: {
    callerInstanceId: any;
    replace: any;
}) => Promise<any>;
export declare const setupInstances: (client: any, opts: {
    happId: string;
    agentId: string;
    conductorInterface: Config.ConductorInterface;
}) => Promise<void>;
export declare const setupServiceLogger: (masterClient: any, { hostedHappId }: {
    hostedHappId: any;
}) => Promise<void>;
export declare const lookupAppEntryInHHA: (client: any, { happId }: LookupHappRequest) => Promise<HappStoreEntry>;
export declare const lookupAppInStoreByHash: (client: any, appHash: any) => Promise<any>;
export declare const lookupDnaByHandle: (client: any, happId: any, handle: any) => Promise<{
    hash: string;
}>;

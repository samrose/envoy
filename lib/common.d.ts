import { InstanceInfo } from './types';
/**
 * The canonical error response when catching a rejection or exception
 * TODO: use this more often!
 */
export declare const errorResponse: (msg: any) => {
    error: any;
};
/**
 * A consistent way to reject promises
 */
export declare const fail: (e: any) => void;
export declare const serializeError: (e: any) => any;
/**
 * Useful for handling express server failure
 */
export declare const catchHttp: (next: any) => (e: any) => void;
/**
 * The method of bundling UIs into a single bundle
 */
export declare const bundleUI: (input: any, target: any) => Promise<{}>;
/**
 * The opposite of `bundleUI`
 */
export declare const unbundleUI: (input: any, target: any) => Promise<{}>;
export declare const downloadFile: ({ url, path }: {
    url: string;
    path: string;
}) => Promise<string>;
export declare const parseAxiosError: (e: any) => any;
/**
 * The UI instance ID for a given hApp
 */
export declare const uiIdFromHappId: (happId: any) => string;
/**
 * The instance ID for a given AgentID and DNA hash
 * If this is the host's instance, the ID is just the DNA hash
 * Another agent's hosted instance gets their agentId appended to it with a ::
 */
export declare const instanceIdFromAgentAndDna: ({ agentId, dnaHash }: {
    agentId: any;
    dnaHash: any;
}) => any;
/**
 * The instance ID for the per-hApp servicelogger
 */
export declare const serviceLoggerInstanceIdFromHappId: (hostedHappId: any) => string;
/**
 * The DNA ID for the per-hApp servicelogger
 */
export declare const serviceLoggerDnaIdFromHappId: (hostedHappId: any) => string;
/**
 * The string used in servicelogger requests to specify the zome function called
 */
export declare const zomeCallSpec: ({ zomeName, funcName }: {
    zomeName: any;
    funcName: any;
}) => string;
declare type CallFnParams = {
    instanceId: string;
    zomeName: string;
    funcName: string;
    args: any;
};
/**
 * Make a zome call through the WS client, identified by instance ID
 * TODO: maybe keep the Ok/Err wrapping, to differentiate between zome error and true exception
 */
export declare const zomeCallByInstance: (client: any, callParams: CallFnParams) => Promise<any>;
/**
 * Look for an instance config via AgentID and DNA hash
 * If no such instance exists, look for the public instance for that DNA
 * If neither exist, reject the promise
 */
export declare const lookupHoloInstance: (client: any, { dnaHash, agentId }: {
    dnaHash: any;
    agentId: any;
}) => Promise<InstanceInfo>;
export declare const whenReady: (client: any) => Promise<{} | undefined>;
export declare const delay: (ms: any) => Promise<{}>;
export {};

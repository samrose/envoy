import { HappID } from '../types';
export declare type CallRequest = {
    agentId: string;
    happId: HappID;
    handle?: string;
    instanceId?: string;
    zome: string;
    function: string;
    params?: any;
    args?: any;
    signature: string;
};
export declare type CallResponse = any;
declare const _default: (masterClient: any, publicClient: any, internalClient: any) => (call: CallRequest) => Promise<any>;
export default _default;
declare type ServiceMetrics = {
    bytes_in: number;
    bytes_out: number;
    cpu_seconds: number;
};
/**
 * Gets called as a separate request from the UI, after the response has been delivered
 */
export declare const logServiceSignature: (client: any, { happId, responseEntryHash, signature }: {
    happId: any;
    responseEntryHash: any;
    signature: any;
}) => Promise<null>;
export declare const buildServiceLoggerRequestPackage: ({ dnaHash, zome, function: func, args }: {
    dnaHash: any;
    zome: any;
    function: any;
    args: any;
}) => {
    function: string;
    args: any;
};
export declare const buildServiceLoggerResponsePackage: (response: any) => any;
export declare const calcMetrics: (request: any, response: any) => ServiceMetrics;

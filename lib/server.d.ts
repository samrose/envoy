/**
 * Server for Holo
 *
 * Accepts requests similar to what the Conductor
 */
import { CallRequest } from './flows/zome-call';
import ConnectionManager from './connection-manager';
declare const _default: (port: any) => EnvoyServer;
export default _default;
/**
 * Replace original rpc-websockets client's call function
 * with one that waits for connection before calling and performs logging,
 * renaming the original function to `_call`
 * @type {[type]}
 */
export declare const makeClient: (url: any, opts: any) => any;
export declare const getMasterClient: (reconnect: any) => any;
export declare const getPublicClient: (reconnect: any) => any;
export declare const getInternalClient: (reconnect: any) => any;
/**
 * A wrapper around a rpc-websockets Server and Client which brokers communication between
 * the browser user and the Conductor. The browser communicates with the Server, and the Client
 * is used to make calls to the Conductor's Websocket interface.
 */
export declare class EnvoyServer {
    server: any;
    clients: {
        [s: string]: any;
    };
    nextCallId: number;
    signingRequests: {};
    connections: ConnectionManager;
    constructor({ masterClient, publicClient, internalClient }: {
        masterClient: any;
        publicClient: any;
        internalClient: any;
    });
    start: (port: any) => Promise<void>;
    /**
     * Close the client connections
     */
    close(): void;
    buildHttpServer: (masterClient: any) => Promise<any>;
    findCaseInsensitiveMatch: (uiAppArray: any, happHashLowerCase: any) => string;
    buildWebsocketServer: (httpServer: any) => Promise<any>;
    identifyAgent: ({ agentId }: {
        agentId: any;
    }) => {
        agentId: any;
    };
    wormholeSignature: ({ signature, requestId }: {
        signature: any;
        requestId: any;
    }) => {
        success: boolean;
    };
    serviceSignature: ({ happId, responseEntryHash, signature }: {
        happId: any;
        responseEntryHash: any;
        signature: any;
    }) => Promise<null>;
    newHostedAgent: ({ agentId, happId }: {
        agentId: any;
        happId: any;
    }) => Promise<{
        success: boolean;
    }>;
    zomeCall: (params: CallRequest) => Promise<any>;
    /**
     * Function to be called externally, registers a signing request which will be fulfilled
     * by the `holo/wormholeSignature` JSON-RPC method registered on this server
     */
    startHoloSigningRequest(agentId: string, entry: Object, callback: (Object: any) => void): void;
}

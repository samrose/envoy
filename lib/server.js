"use strict";
/**
 * Server for Holo
 *
 * Accepts requests similar to what the Conductor
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const rpc_websockets_1 = require("rpc-websockets");
const Config = require("./config");
const zome_call_1 = require("./flows/zome-call");
const new_agent_1 = require("./flows/new-agent");
const connection_manager_1 = require("./connection-manager");
const wormhole_server_1 = require("./wormhole-server");
const admin_host_server_1 = require("./admin-host-server");
const happ_server_1 = require("./shims/happ-server");
const successResponse = { success: true };
exports.default = (port) => {
    // clients to the interface served by the Conductor
    const masterClient = exports.getMasterClient(true);
    const publicClient = exports.getPublicClient(true);
    const internalClient = exports.getInternalClient(true);
    console.debug("Connecting to admin and happ interfaces...");
    const server = new EnvoyServer({ masterClient, publicClient, internalClient });
    server.start(port);
    return server;
};
/**
 * Replace original rpc-websockets client's call function
 * with one that waits for connection before calling and performs logging,
 * renaming the original function to `_call`
 * @type {[type]}
 */
exports.makeClient = (url, opts) => {
    const client = new rpc_websockets_1.Client(url, opts);
    client._call = client.call;
    client.call = callWhenConnected;
    return client;
};
/**
 * If the WS client is connected to the server, make the RPC call immediately
 * Otherwise, wait for connection, then make the call
 * Return a promise that resolves when the call is complete
 * NB: `this._call` comes from `makeClient` above
 * TODO: may eventually be superseded by ConnectionManager
 */
function callWhenConnected(method, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        // Do waiting
        let promise;
        if (this.ready) {
            promise = Promise.resolve(this._call(method, payload));
        }
        else {
            promise = new Promise((resolve, reject) => {
                this.once('open', () => {
                    this._call(method, payload).then(resolve).catch(reject);
                });
            });
        }
        // Do snazzy logging
        return promise.then(responseRaw => {
            const response = (responseRaw && typeof responseRaw === 'string') ? JSON.parse(responseRaw) : responseRaw;
            console.log("");
            console.log(`WS call: ${method}`.dim.inverse);
            console.log('request'.green.bold, `------>`.green.bold, `(${typeof payload})`.green.italic);
            console.log(JSON.stringify(payload, null, 2));
            console.log('response'.cyan.bold, `<-----`.cyan.bold, `(${typeof response})`.cyan.italic);
            console.log(JSON.stringify(response, null, 2));
            console.log("");
            return response;
        });
    });
}
const clientOpts = reconnect => ({ max_reconnects: 0, reconnect }); // zero reconnects means unlimited
exports.getMasterClient = (reconnect) => exports.makeClient(`ws://localhost:${Config.PORTS.masterInterface}`, clientOpts(reconnect));
exports.getPublicClient = (reconnect) => exports.makeClient(`ws://localhost:${Config.PORTS.publicInterface}`, clientOpts(reconnect));
exports.getInternalClient = (reconnect) => exports.makeClient(`ws://localhost:${Config.PORTS.internalInterface}`, clientOpts(reconnect));
const verifySignature = (entry, signature) => true;
const fail = (e) => {
    console.error("envoy server request failure:", e);
    return e;
};
const requiredFields = (...fields) => {
    const missing = fields.filter(field => field === undefined);
    if (missing.length > 0) {
        throw `The following fields were missing: ${missing.join(', ')}`;
    }
};
/**
 * A wrapper around a rpc-websockets Server and Client which brokers communication between
 * the browser user and the Conductor. The browser communicates with the Server, and the Client
 * is used to make calls to the Conductor's Websocket interface.
 */
class EnvoyServer {
    constructor({ masterClient, publicClient, internalClient }) {
        this.nextCallId = 0;
        this.signingRequests = {};
        this.start = (port) => __awaiter(this, void 0, void 0, function* () {
            let wss, httpServer, shimServer, adminServer, wormholeServer;
            const server = this;
            const importantConnections = ['master'];
            this.connections = new connection_manager_1.default({
                connections: importantConnections,
                onStart: () => __awaiter(this, void 0, void 0, function* () {
                    console.log("Beginning server startup");
                    httpServer = yield this.buildHttpServer(this.clients.master);
                    console.log("HTTP server initialized");
                    wss = yield this.buildWebsocketServer(httpServer);
                    console.log("WS server initialized");
                    shimServer = happ_server_1.default(Config.PORTS.shim);
                    adminServer = admin_host_server_1.default(Config.PORTS.admin, Config.defaultEnvoyHome, server.clients.master);
                    wormholeServer = wormhole_server_1.default(Config.PORTS.wormhole, server);
                    yield httpServer.listen(port, () => console.log('HTTP server running on port', port));
                    wss.on('listening', () => console.log("Websocket server listening on port", port));
                    wss.on('error', data => console.log("<C> error: ", data));
                    this.server = wss;
                }),
                onStop: () => {
                    if (wss) {
                        wss.close();
                        console.log("Shut down wss");
                    }
                    else {
                        console.log("Not shutting down wss??");
                    }
                    if (httpServer) {
                        httpServer.close();
                        console.log("Shut down httpServer");
                    }
                    else {
                        console.log("Not shutting down httpServer??");
                    }
                    if (adminServer) {
                        adminServer.close();
                        console.log("Shut down adminServer");
                    }
                    else {
                        console.log("Not shutting down adminServer??");
                    }
                    if (wormholeServer) {
                        wormholeServer.close();
                        console.log("Shut down wormholeServer");
                    }
                    else {
                        console.log("Not shutting down wormholeServer??");
                    }
                    if (shimServer) {
                        shimServer.stop();
                        console.log("Shut down shimServer");
                    }
                    else {
                        console.log("Not shutting down shimServer??");
                    }
                    this.server = null;
                },
            });
            // TODO: rework this so public and internal clients going down doesn't shut down
            // stuff that only affects the master client
            importantConnections.forEach(name => {
                const client = this.clients[name];
                client.on('open', () => this.connections.add(name));
                client.on('close', () => this.connections.remove(name));
            });
        });
        this.buildHttpServer = (masterClient) => __awaiter(this, void 0, void 0, function* () {
            const app = express();
            // Simply rely on the fact that UIs are installed in a directory
            // named after their happId
            // TODO: check access to prevent cross-UI requests?
            const uiRoot = Config.uiStorageDir(Config.defaultEnvoyHome);
            const uiDir = Config.devUI ? path.join(uiRoot, Config.devUI) : uiRoot;
            console.log("Serving all UIs from: ", uiDir);
            app.use(morgan('dev'));
            // use the following for file-based logging
            // const logStream = fs.createWriteStream(path.join(__dirname, '..', 'log', 'access.log'), { flags: 'a' })
            // app.use(morgan(logFormat, {stream: logStream}))
            app.use('*', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                const host = req.headers['x-forwarded-host'] || "";
                const [happHash, partialAgentId, ...domain] = host.split('.');
                const domainExpected = 'holohost.net'.split('.');
                const validHost = (domain[0] === domainExpected[0]
                    && domain[1] === domainExpected[1]
                    && happHash
                    && partialAgentId);
                if (!validHost) {
                    next(new Error("X-Forwarded-Host header not properly set. Received: " + host));
                }
                else {
                    // TODO: Refactor following once we have a solution to host happs with case-SENSITIVITY in tact.
                    // Since domain names are case-insensitive, we lose casing on the happ hash.
                    // Therefore, we need to search for the properly cased directory to serve from.
                    const uiApps = (sourceDir) => fs.readdirSync(sourceDir).filter(file => fs.statSync(path.join(sourceDir, file)).isDirectory());
                    const uiAppArray = uiApps(uiDir);
                    const trueHappHash = yield this.findCaseInsensitiveMatch(uiAppArray, happHash);
                    if (!trueHappHash) {
                        next(new Error(`The case-insensitive happ hash '${happHash}' appears not to have been installed on this conductor!`));
                    }
                    const staticFile = path.join(uiDir, trueHappHash, req.originalUrl);
                    console.log('serving static UI asset: ', staticFile);
                    res.sendFile(staticFile, null, next);
                }
            }));
            return require('http').createServer(app);
        });
        this.findCaseInsensitiveMatch = (uiAppArray, happHashLowerCase) => {
            let _casedHapp;
            const happBundle = uiAppArray.filter(happ => {
                return happHashLowerCase.match(new RegExp(happ, 'i'));
            });
            _casedHapp = happBundle[0];
            // console.log("RESULT from _casedHapp : ", _casedHapp);
            return _casedHapp;
        };
        this.buildWebsocketServer = (httpServer) => __awaiter(this, void 0, void 0, function* () {
            const wss = new rpc_websockets_1.Server({ server: httpServer });
            // NB: the following closures are intentional, i.e. just passing the
            // member function to wss.register causes sinon to not correctly be able
            // to spy on the function calls. Don't simplify!
            wss.register('holo/identify', a => this.identifyAgent(a));
            wss.register('holo/clientSignature', a => this.wormholeSignature(a)); // TODO: deprecated
            wss.register('holo/wormholeSignature', a => this.wormholeSignature(a));
            wss.register('holo/serviceSignature', a => this.serviceSignature(a));
            wss.register('holo/call', a => this.zomeCall(a));
            // TODO: something in here to update the agent key subscription? i.e. re-identify?
            wss.register('holo/agents/new', a => this.newHostedAgent(a));
            return wss;
        });
        this.identifyAgent = ({ agentId }) => {
            requiredFields(agentId);
            // TODO: also take salt and signature of salt to prove browser owns agent ID
            console.log("adding new event to server", `agent/${agentId}/sign`);
            try {
                this.server.event(`agent/${agentId}/sign`);
            }
            catch (e) {
                if (e.message.includes('Already registered event')) {
                    console.log('welcome back', agentId);
                }
                else {
                    throw e;
                }
            }
            console.log('identified as ', agentId);
            return { agentId };
        };
        this.wormholeSignature = ({ signature, requestId }) => {
            console.log("Totally gettin' called...", { signature, requestId });
            requiredFields(requestId);
            const { entry, callback } = this.signingRequests[requestId];
            verifySignature(entry, signature); // TODO: really?
            callback(signature);
            delete this.signingRequests[requestId];
            return successResponse;
        };
        this.serviceSignature = ({ happId, responseEntryHash, signature }) => {
            requiredFields(happId, responseEntryHash, signature);
            return zome_call_1.logServiceSignature(this.clients.internal, { happId, responseEntryHash, signature });
        };
        this.newHostedAgent = ({ agentId, happId }) => __awaiter(this, void 0, void 0, function* () {
            requiredFields(agentId, happId);
            const signature = 'TODO';
            yield new_agent_1.default(this.clients.master)({ agentId, happId, signature });
            return successResponse;
        });
        this.zomeCall = (params) => {
            return zome_call_1.default(this.clients.public, this.clients.internal)(params).catch(fail);
        };
        this.clients = {
            master: masterClient,
            public: publicClient,
            internal: internalClient,
        };
    }
    /**
     * Close the client connections
     */
    close() {
        Object.keys(this.clients).forEach((name) => {
            console.log(`Closing client: `, name);
            this.clients[name].reconnect = false;
            this.clients[name].close();
        });
        // this.connections.dismantle()
    }
    /**
     * Function to be called externally, registers a signing request which will be fulfilled
     * by the `holo/wormholeSignature` JSON-RPC method registered on this server
     */
    startHoloSigningRequest(agentId, entry, callback) {
        const id = this.nextCallId++;
        console.debug('envoy server emitting sign request event: ', `agent/${agentId}/sign`, { entry, id });
        this.server.emit(`agent/${agentId}/sign`, { entry, id });
        this.signingRequests[id] = { entry, callback };
    }
}
exports.EnvoyServer = EnvoyServer;
//# sourceMappingURL=server.js.map
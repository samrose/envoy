"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const archiver = require("archiver");
const extract = require("extract-zip");
const fs = require("fs-extra");
const Config = require("./config");
const types_1 = require("./types");
/**
 * The canonical error response when catching a rejection or exception
 * TODO: use this more often!
 */
exports.errorResponse = msg => ({ error: msg });
/**
 * A consistent way to reject promises
 */
exports.fail = e => console.error("FAIL: ", e);
exports.serializeError = e => (typeof e === 'object' && !(e instanceof Error)
    ? JSON.stringify(e)
    : e);
/**
 * Useful for handling express server failure
 */
exports.catchHttp = next => e => {
    console.error("HTTP error caught:".red);
    next(exports.serializeError(e));
};
/**
 * The method of bundling UIs into a single bundle
 */
exports.bundleUI = (input, target) => new Promise((resolve, reject) => {
    const output = fs.createWriteStream(target);
    const archive = archiver('zip');
    output.on('finish', () => resolve(target));
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(input, false);
    archive.finalize();
});
/**
 * The opposite of `bundleUI`
 */
exports.unbundleUI = (input, target) => new Promise((resolve, reject) => {
    console.debug("Unbundling...");
    extract(input, { dir: target }, function (err) {
        if (err) {
            reject(err);
        }
        else {
            resolve(target);
        }
        // extraction is complete. make sure to handle the err
    });
});
///////////////////////////////////////////////////////////////////
///////////////////////      UTIL      ////////////////////////////
///////////////////////////////////////////////////////////////////
/**
 * The UI instance ID for a given hApp
 */
exports.uiIdFromHappId = (happId => happId + '-ui');
/**
 * The instance ID for a given AgentID and DNA hash
 * If a nickname exists for a DNA, use that as the "canonical name".
 * Otherwise, use DNA hash as canonical name
 * The host's own instances are just given the canonical name.
 * Another agent's hosted instance gets their agentId prepended to it.
 */
exports.instanceIdFromAgentAndDna = (agentId, dnaHash) => {
    const nick = Config.getNickByDna(dnaHash);
    const isHost = agentId === Config.hostAgentName;
    const canonicalName = nick ? nick : dnaHash;
    return isHost ? canonicalName : `${canonicalName}::${agentId}`;
};
/**
 * The instance ID for the per-hApp servicelogger
 */
exports.serviceLoggerInstanceIdFromHappId = hostedHappId => (`servicelogger-${hostedHappId}`);
/**
 * The DNA ID for the per-hApp servicelogger
 */
exports.serviceLoggerDnaIdFromHappId = exports.serviceLoggerInstanceIdFromHappId;
/**
 * The string used in servicelogger requests to specify the zome function called
 */
exports.zomeCallSpec = ({ zomeName, funcName }) => (`${zomeName}/${funcName}`);
/**
 * Make a zome call through the WS client, identified by AgentID + DNA Hash
 */
exports.zomeCallByDna = (client, { agentId, dnaHash, zomeName, funcName, params }) => __awaiter(this, void 0, void 0, function* () {
    let instance = yield exports.lookupHoloInstance(client, { dnaHash, agentId });
    const instanceId = exports.instanceIdFromAgentAndDna(instance.agentId, instance.dnaHash);
    return exports.zomeCallByInstance(client, { instanceId, zomeName, funcName, params });
});
/**
 * Make a zome call through the WS client, identified by instance ID
 * TODO: maybe keep the Ok/Err wrapping, to differentiate between zome error and true exception
 */
exports.zomeCallByInstance = (client, { instanceId, zomeName, funcName, params }) => __awaiter(this, void 0, void 0, function* () {
    const payload = {
        instance_id: instanceId,
        zome: zomeName,
        function: funcName,
        params
    };
    let result;
    try {
        result = yield client.call('call', payload);
        if (!result) {
            throw `falsy result! (${result})`;
        }
    }
    catch (e) {
        console.error("ZOME CALL FAILED");
        console.error(e);
        console.error("payload:", payload);
        console.error("result: ", result);
        throw e;
    }
    if (!("Ok" in result)) {
        throw result;
    }
    else {
        return result.Ok;
    }
});
/**
 * Look for an instance config via AgentID and DNA hash
 * If no such instance exists, look for the public instance for that DNA
 * If neither exist, reject the promise
 */
exports.lookupHoloInstance = (client, { dnaHash, agentId }) => __awaiter(this, void 0, void 0, function* () {
    const instances = (yield client.call('info/instances', {}))
        .map(({ dna, agent }) => ({
        dnaHash: dna,
        agentId: agent
    }));
    const hosted = instances.find(inst => inst.dnaHash === dnaHash && inst.agentId === agentId);
    if (hosted) {
        console.debug("Found instance for hosted agent: ", hosted);
        return Object.assign(hosted, { type: types_1.InstanceType.Hosted });
    }
    else {
        const pub = instances.find(inst => inst.dnaHash === dnaHash && inst.agentId === Config.hostAgentName);
        if (pub) {
            console.debug("Found public instance: ", pub);
            return Object.assign(pub, { type: types_1.InstanceType.Public });
        }
        else {
            throw `No instance found
        where agentId == '${agentId}' || agentId == '${Config.hostAgentName}'
        and   dnaHash == '${dnaHash}'
      `;
        }
    }
});
exports.whenReady = (client) => __awaiter(this, void 0, void 0, function* () {
    if (!client.ready) {
        return new Promise(resolve => {
            client.once('open', resolve);
        });
    }
});
//# sourceMappingURL=common.js.map
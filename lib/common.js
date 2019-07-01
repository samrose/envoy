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
const axios_1 = require("axios");
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
exports.downloadFile = ({ url, path }) => __awaiter(this, void 0, void 0, function* () {
    const response = yield axios_1.default.request({
        url: url,
        method: 'GET',
        responseType: 'stream',
        maxContentLength: 999999999999,
    }).catch(e => {
        console.warn('axios error: ', exports.parseAxiosError(e));
        return e.response;
    });
    return new Promise((fulfill, reject) => {
        if (response.status != 200) {
            reject(`Could not fetch ${url}, response was ${response.statusText} ${response.status}`);
        }
        else {
            const writer = fs.createWriteStream(path)
                .on("finish", () => fulfill(path))
                .on("error", reject);
            console.debug("Starting streaming download...");
            response.data.pipe(writer);
        }
    });
});
// print less of the enormous axios error object
exports.parseAxiosError = e => {
    if ('config' in e && 'request' in e && 'response' in e) {
        return {
            request: {
                method: e.config.method,
                url: e.config.url,
                data: e.config.data,
            },
            response: !e.response ? e.response : {
                status: e.response.status,
                statusText: e.response.statusText,
                data: e.response.data,
            }
        };
    }
    else {
        return e;
    }
};
///////////////////////////////////////////////////////////////////
///////////////////////      UTIL      ////////////////////////////
///////////////////////////////////////////////////////////////////
/**
 * The UI instance ID for a given hApp
 */
exports.uiIdFromHappId = (happId => happId + '-ui');
/**
 * The instance ID for a given AgentID and DNA hash
 * If this is the host's instance, the ID is just the DNA hash
 * Another agent's hosted instance gets their agentId appended to it with a ::
 */
exports.instanceIdFromAgentAndDna = ({ agentId, dnaHash }) => {
    const isHost = agentId === Config.hostAgentName;
    return isHost ? dnaHash : `${dnaHash}::${agentId}`;
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
 * Make a zome call through the WS client, identified by instance ID
 * TODO: maybe keep the Ok/Err wrapping, to differentiate between zome error and true exception
 */
exports.zomeCallByInstance = (client, callParams) => __awaiter(this, void 0, void 0, function* () {
    const { instanceId, zomeName, funcName, args = {} } = callParams;
    const payload = {
        instance_id: instanceId,
        zome: zomeName,
        function: funcName,
        args: args || {},
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
exports.delay = ms => new Promise(resolve => setTimeout(resolve, ms));
//# sourceMappingURL=common.js.map
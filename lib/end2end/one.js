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
const test = require("tape");
const C = require("../config");
const command_1 = require("./command");
process.on('unhandledRejection', (reason, p) => {
    console.log("UNHANDLED REJECTION:");
    console.log("reason: ", reason);
});
const dnaHash = 'Qm_WHATEVER_TODO';
const agentId = 'total-dummy-fake-not-real-agent-public-address';
test('can install app', (t) => __awaiter(this, void 0, void 0, function* () {
    command_1.withEnvoyClient(agentId, (client) => __awaiter(this, void 0, void 0, function* () {
        // TODO: conductor panics if installing the same app twice!
        console.log('installing happ...');
        yield client.call('holo/happs/install', { happId: 'TODO', agentId: C.hostAgentName });
        const newAgent = yield client.call('holo/agents/new', { agentId, happId: 'TODO NOT REAL HAPPID' });
        t.end();
    }));
}));
test('end to end test (assuming app is installed)', (t) => __awaiter(this, void 0, void 0, function* () {
    command_1.withEnvoyClient(agentId, (client) => __awaiter(this, void 0, void 0, function* () {
        console.log('identifying...');
        const agentName = C.hostAgentName;
        const agentId = yield client.call('holo/identify', { agentId: agentName });
        t.equal(agentId, agentName);
        console.log('identified!');
        const happId = 'TODO';
        const func = 'simple/get_links';
        const params = { base: 'QmTODO' };
        const signature = 'TODO';
        const result = yield client.call('holo/call', {
            agentId: agentName, happId, dnaHash, function: func, params, signature
        });
        console.log(result);
        t.ok(result.Ok);
        t.equal(result.Ok.addresses.length, 0);
        t.end();
    }));
}));
test('end to end hosted agent test (assuming app is installed)', (t) => __awaiter(this, void 0, void 0, function* () {
    command_1.withEnvoyClient(agentId, (client) => __awaiter(this, void 0, void 0, function* () {
        console.log('identifying...');
        // const num = Math.floor(Math.random() * 10000)
        // const num = '5079'
        const returnedAgentId = yield client.call('holo/identify', { agentId });
        t.equal(agentId, returnedAgentId);
        const happId = 'TODO';
        const func = 'simple/get_links';
        const params = { base: 'QmTODO' };
        const signature = 'TODO';
        const result = yield client.call('holo/call', {
            agentId: agentId, happId, dnaHash, function: func, params, signature
        });
        t.ok(result.Ok);
        t.equal(result.Ok.addresses.length, 0);
        t.end();
    }));
}));
//# sourceMappingURL=one.js.map
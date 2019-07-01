"use strict";
/**
 * Server for Holo
 *
 * Accepts requests similar to what the Conductor
 */
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const Config = require("./config");
Config.hcDependencyCheck();
// console.debug = () => {}
process.on('unhandledRejection', (reason, p) => {
    console.log("*** UNHANDLED REJECTION ***");
    console.log("reason: ", reason);
});
server_1.default(Config.PORTS.external);
//# sourceMappingURL=index.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const os = require("os");
const child_process_1 = require("child_process");
exports.devUI = process.env.ENVOY_UI || "";
const testMode = Boolean(process.env.ENVOY_TEST);
if (exports.devUI) {
    console.log("Using hApp ID for dev UI: ", exports.devUI);
}
exports.defaultEnvoyHome = process.env.ENVOY_PATH || path.join(os.homedir(), '.holochain/holo');
exports.conductorConfigPath = (dir) => path.join(dir || exports.defaultEnvoyHome, 'conductor-config.toml');
exports.uiStorageDir = (dir) => path.join(dir || exports.defaultEnvoyHome, 'ui-store');
exports.chainStorageDir = (dir) => path.join(dir || exports.defaultEnvoyHome, 'storage');
exports.testKeyDir = path.join(os.tmpdir(), 'holo-envoy', 'test-keydata');
exports.testKeybundlePath = path.join(exports.testKeyDir, 'keybundle.json');
exports.testAgentAddressPath = path.join(exports.testKeyDir, 'ENVOY_AGENT_ADDRESS');
exports.testKeyPassphrase = ''; // TODO: can go away once `hc keygen --nullpass` fully works
exports.hostAgentName = 'host-agent';
exports.holoHostingAppId = {
    instance: 'holo-hosting-app',
    dna: 'holo-hosting-app',
};
exports.happStoreId = {
    instance: 'happ-store',
    dna: 'happ-store',
};
exports.holofuelId = {
    instance: 'holofuel',
    dna: 'holofuel',
};
exports.keyConfigFile = 'src/config/envoy-host-key.json';
var ConductorInterface;
(function (ConductorInterface) {
    ConductorInterface["Master"] = "master-interface";
    ConductorInterface["Public"] = "public-interface";
    ConductorInterface["Internal"] = "internal-interface";
})(ConductorInterface = exports.ConductorInterface || (exports.ConductorInterface = {}));
exports.resourcePath = path.join(__dirname, './.envoy-deps');
exports.DEPENDENCIES = require('./dependencies').default(exports.resourcePath);
exports.PORTS = {
    // Actual server ports, visible outside of this machine
    external: 48080,
    admin: 9999,
    // These will eventually go away
    wormhole: 8888,
    // Websocket ports, interfaces into the running conductor
    masterInterface: 1111,
    publicInterface: 2222,
    internalInterface: 3333,
};
exports.hcDependencyCheck = () => {
    // Check for version mismatch in holochain binary
    const requiredHcVersion = exports.DEPENDENCIES.holochainVersion;
    child_process_1.exec(`holochain --version`, (err, stdout, stderr) => {
        const [_, installedVersion] = stdout.trim().split('holochain ');
        if (err) {
            console.error("Could not check Holochain error, is the `holochain` binary installed?");
            process.exit(-1);
        }
        else if (!installedVersion) {
            console.error("Could not figure out holochain version from command line! `holochain --version` produced:");
            console.error(stdout);
            process.exit(-1);
        }
        else if (installedVersion !== requiredHcVersion) {
            console.error(`Installed HC version '${installedVersion}' does not match required version '${requiredHcVersion}' as specified in dependencies config. Aborting.`);
            process.exit(-1);
        }
        else {
            console.log(`required holochain version:  ${requiredHcVersion}`);
            console.log(`installed holochain version: ${installedVersion}`);
        }
    });
};
//# sourceMappingURL=index.js.map
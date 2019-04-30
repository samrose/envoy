"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const os = require("os");
const nick_database_1 = require("../shims/nick-database");
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
exports.keyConfigFile = 'src/shims/envoy-host-key.json';
var ConductorInterface;
(function (ConductorInterface) {
    ConductorInterface["Master"] = "master-interface";
    ConductorInterface["Public"] = "public-interface";
    ConductorInterface["Internal"] = "internal-interface";
})(ConductorInterface = exports.ConductorInterface || (exports.ConductorInterface = {}));
const testUserConfig = {
    resources: {
        serviceLogger: {
            dna: {
                path: '/path/to/happs/servicelogger/dist/servicelogger.dna.json',
            }
        },
        holofuel: {
            dna: {
                path: '/path/to/happs/holofuel/dist/holofuel.dna.json',
            }
        },
        holoHosting: {
            dna: {
                path: '/path/to/happs/Holo-Hosting-App/dna-src/dist/dna-src.dna.json',
            },
            ui: {
                path: '/path/to/happs/holo-hosting-app_GUI/ui',
                port: 8800,
            },
        },
        happStore: {
            dna: {
                path: '/path/to/happs/HApps-Store/dna-src/dist/dna-src.dna.json',
            },
            ui: {
                path: '/path/to/happs/HApps-Store/ui',
                port: 8880,
            },
        }
    }
};
const updateDnaConfigToUserConfig = (config) => {
    const newConfig = {};
    Object.entries(config).forEach(([name, c]) => {
        newConfig[name] = {
            dna: {
                path: c.path
            }
        };
    });
    return { resources: newConfig };
};
const readOutdatedDnaConfig = () => {
    try {
        return require('./dna-config').default;
    }
    catch (_a) {
        return null;
    }
};
/**
 * Read the user-config.ts file, automatically migrating the old dna-config.ts file if
 * applicable
 *
 * TODO: this can be simplified considerably once everyone is off of dna-config.ts
 */
const readUserConfig = () => {
    let readUserConfigCount = 0;
    const run = () => {
        if (++readUserConfigCount > 2) {
            console.error("Could not auto-create user-config.ts file, or remove dna-config.ts and create user-config.ts yourself");
            process.exit(-1);
        }
        try {
            // Load core DNA paths from special untracked file
            return require('./user-config').default;
        }
        catch (e) {
            // In CI tests, we won't have this file, so just use a dummy object
            if (testMode) {
                return testUserConfig;
            }
            else {
                const outdatedDnaConfig = readOutdatedDnaConfig();
                if (outdatedDnaConfig) {
                    const userConfig = updateDnaConfigToUserConfig(outdatedDnaConfig);
                    userConfig.resources.happStore.ui = {
                        path: '<<FILL ME IN>>',
                        port: 8880,
                    };
                    userConfig.resources.holoHosting.ui = {
                        path: '<<FILL ME IN>>',
                        port: 8800,
                    };
                    const userConfigPath = path.join(__dirname, 'user-config.ts');
                    const contents = `
export default ${JSON.stringify(userConfig, null, 2)}


// YOU MAY DELETE EVERYTHING BELOW THIS LINE
// Be sure to fill in the blanks for the UI paths above!


// Automatically migrated original DNA config, listed below for safety.
const portedConfig = ${JSON.stringify(outdatedDnaConfig, null, 2)}

`;
                    fs.writeFileSync(userConfigPath, contents);
                    console.log();
                    console.log("----------------------------------------------------------------------------");
                    console.log("Deprecated dna-config.ts file found, moving info over to user-config.ts");
                    console.log("Be sure to update your user-config.ts to include UI paths!");
                    console.log("Deleting your dna-config.ts file now...");
                    console.log("----------------------------------------------------------------------------");
                    console.log();
                    const outdatedDnaConfigPath = path.join(__dirname, 'dna-config.ts');
                    fs.unlinkSync(outdatedDnaConfigPath);
                    return run();
                }
                console.error(`You must provide a src/config/user-config.ts file pointing to the core DNA packages.
    Example:

    export default ${JSON.stringify(testUserConfig)}
      `);
                return process.exit(-1);
            }
        }
    };
    return run();
};
exports.RESOURCES = readUserConfig().resources;
// The nicknames are a temporary thing, to complement the nicknames in
// `src/shims/nick-database`. They'll go away when we have "app bundles".
const dnaNicks = {
    servicelogger: 'servicelogger',
    holoHosting: 'holo-hosting-app',
    holofuel: 'holofuel',
    happStore: 'happ-store',
};
exports.PORTS = {
    // Actual server ports, visible outside of this machine
    external: 48080,
    admin: 9999,
    // These will eventually go away
    wormhole: 8888,
    shim: 5555,
    // Websocket ports, interfaces into the running conductor
    masterInterface: 1111,
    publicInterface: 2222,
    internalInterface: 3333,
};
// Get the nick for a DNA from the nickDatabase (another hack), if a DNA from the app store.
// TODO: remove once we have proper app bundles with handles for DNAs
exports.getNickByDna = dnaHash => {
    const externalApp = nick_database_1.nickDatabase.find(entry => Boolean(entry.knownDnaHashes.find(hash => hash === dnaHash)));
    return externalApp ? externalApp.nick : null;
};
//# sourceMappingURL=index.js.map
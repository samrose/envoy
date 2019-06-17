"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const path = require("path");
const child_process_1 = require("child_process");
const common_1 = require("../common");
const Config = require("../config");
const hostedHapps = [
    {
        dnas: ['./src/shims/happ-data/holochain-basic-chat/dna-src/'],
        ui: './src/shims/happ-data/holochain-basic-chat/ui'
    },
];
const coreHapps = Object.values(Config.RESOURCES).map(entry => {
    // peel off two layers of directories to get to the actual dna source root
    const dir = path.dirname(path.dirname(entry.dna.path));
    return {
        dnas: [dir],
        ui: null,
    };
});
const uiBundlePromises = [];
const buildHapp = happ => {
    if (happ.ui) {
        const zipPath = path.join(happ.ui, '..', 'ui.zip');
        try {
            fs.unlinkSync(zipPath);
        }
        catch (_a) {
            console.warn(`No ${zipPath}, skipping...`);
        }
        console.log(`Bundling UI for ${happ.ui} ...`);
        const promise = common_1.bundleUI(happ.ui, zipPath);
        uiBundlePromises.push(promise);
    }
    happ.dnas.forEach(dir => {
        console.log(`Packaging DNA for '${dir}'...`);
        child_process_1.execSync(`find $dir -name Cargo.lock -delete`);
        child_process_1.execSync(`find $dir -name target | xargs -i{} rm -r {}`);
        child_process_1.execSync(`cd ${dir} && git pull && hc package --strip-meta`);
    });
};
const cleanHapp = happ => {
    happ.dnas.forEach(dir => {
        const dist = path.join(dir, 'dist/*');
        try {
            child_process_1.execSync(`rm ${dist}`);
            console.log("Removed", dist);
        }
        catch (e) {
            console.warn("Could not remove", dist);
        }
    });
};
exports.build = () => {
    console.log("Building core hApps...");
    coreHapps.forEach(buildHapp);
    console.log("Building hosted hApps...");
    hostedHapps.forEach(buildHapp);
    Promise.all(uiBundlePromises).then((results) => {
        console.log('All done!');
        if (results.length) {
            console.log('UI bundles: ', results);
        }
    });
};
exports.clean = () => {
    console.log("Cleaning core hApps...");
    coreHapps.forEach(cleanHapp);
    console.log("Cleaning hosted hApps...");
    hostedHapps.forEach(cleanHapp);
};
if (process.argv[2] === 'build') {
    exports.build();
}
else if (process.argv[2] === 'clean') {
    exports.clean();
}
//# sourceMappingURL=build-happs.js.map
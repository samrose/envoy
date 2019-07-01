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
const fs = require('fs-extra');
const Config = require("../config");
const common_1 = require("../common");
const downloadDeps = () => __awaiter(this, void 0, void 0, function* () {
    const resources = Config.DEPENDENCIES.resources;
    yield fs.emptyDir(Config.resourcePath);
    const dnas = [
        resources.holofuel.dna,
        resources.serviceLogger.dna,
        resources.holoHosting.dna,
        resources.happStore.dna,
    ];
    const uis = [
        resources.holoHosting.ui,
        resources.happStore.ui,
        resources.holofuel.ui,
    ];
    const dnaPromises = dnas.map(dep => common_1.downloadFile({ url: dep.location, path: dep.path }));
    const uiPromises = uis.map((dep) => __awaiter(this, void 0, void 0, function* () {
        const dir = dep.path;
        const zipPath = dir + '.zip';
        yield common_1.downloadFile({ url: dep.location, path: zipPath });
        yield common_1.unbundleUI(zipPath, dir);
        yield fs.unlink(zipPath);
        return dir;
    }));
    return Promise.all(dnaPromises.concat(uiPromises));
});
const main = () => {
    downloadDeps().then(results => {
        console.log(`Downloaded all ${results.length} dependencies`);
        // if (results.some(r => r)) {}
    }).catch(err => {
        console.error("Could not download dependencies: ", (err));
        process.exit(-1);
    });
};
main();
//# sourceMappingURL=download-deps.js.map
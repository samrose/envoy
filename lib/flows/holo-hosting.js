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
const C = require("../config");
const common_1 = require("../common");
exports.enableHapp = (client, happId) => {
    return common_1.zomeCallByInstance(client, {
        instanceId: C.holoHostingAppId.instance,
        zomeName: 'host',
        funcName: 'enable_app',
        params: {
            app_hash: happId
        }
    });
};
exports.disableHapp = (client, happId) => {
    return common_1.zomeCallByInstance(client, {
        instanceId: C.holoHostingAppId.instance,
        zomeName: 'host',
        funcName: 'disable_app',
        params: {
            app_hash: happId
        }
    });
};
exports.registerAsHost = (client) => {
    return common_1.zomeCallByInstance(client, {
        instanceId: C.holoHostingAppId.instance,
        zomeName: 'host',
        funcName: 'register_as_host',
        params: {
            host_doc: {
                kyc_proof: "TODO this proves nothing",
            }
        }
    });
};
exports.SHIMS = {
    registerAsProvider: (client) => {
        return common_1.zomeCallByInstance(client, {
            instanceId: C.holoHostingAppId.instance,
            zomeName: 'provider',
            funcName: 'register_as_provider',
            params: {
                provider_doc: {
                    kyc_proof: "TODO this proves nothing",
                }
            }
        });
    },
    createAndRegisterHapp: (client, entry) => __awaiter(this, void 0, void 0, function* () {
        const title = "TODO";
        const description = "TODO";
        const thumbnail_url = "TODO.gif";
        const homepage_url = "TODO.com";
        const happHash = yield common_1.zomeCallByInstance(client, {
            instanceId: C.happStoreId.instance,
            zomeName: 'happs',
            funcName: 'create_app',
            params: {
                title, description, thumbnail_url, homepage_url,
                ui: entry.ui,
                dnas: entry.dnas,
            }
        });
        const dns_name = "TODO.whatever.xyz";
        return common_1.zomeCallByInstance(client, {
            instanceId: C.holoHostingAppId.instance,
            zomeName: 'provider',
            funcName: 'register_app',
            params: {
                app_bundle: {
                    happ_hash: happHash
                },
                domain_name: { dns_name },
            }
        });
    })
};
//# sourceMappingURL=holo-hosting.js.map
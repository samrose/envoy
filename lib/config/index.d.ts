export declare const devUI: string;
export declare const defaultEnvoyHome: string;
export declare const conductorConfigPath: (dir?: any) => string;
export declare const uiStorageDir: (dir?: any) => string;
export declare const chainStorageDir: (dir?: any) => string;
export declare const testKeyDir: string;
export declare const testKeybundlePath: string;
export declare const testAgentAddressPath: string;
export declare const testKeyPassphrase = "";
export declare const hostAgentName = "host-agent";
export declare const holoHostingAppId: {
    instance: string;
    dna: string;
};
export declare const happStoreId: {
    instance: string;
    dna: string;
};
export declare const holofuelId: {
    instance: string;
    dna: string;
};
export declare const keyConfigFile = "src/config/envoy-host-key.json";
export declare enum ConductorInterface {
    Master = "master-interface",
    Public = "public-interface",
    Internal = "internal-interface"
}
declare type DnaConfig = {
    location: string;
    path: string;
};
declare type UiConfig = {
    location: string;
    path: string;
    port: number;
};
declare type DependencyConfig = {
    holochainVersion: string;
    resources: Resources;
    testResources: TestResources;
};
declare type Resources = {
    serviceLogger: {
        dna: DnaConfig;
    };
    holofuel: {
        dna: DnaConfig;
        ui: UiConfig;
    };
    holoHosting: {
        dna: DnaConfig;
        ui: UiConfig;
    };
    happStore: {
        dna: DnaConfig;
        ui: UiConfig;
    };
};
declare type TestResources = {
    basicChat: TestConfig;
};
declare type TestConfig = {
    dna: TestResource;
    ui: TestResource;
};
declare type TestResource = {
    location: string;
    hash: string;
};
export declare const resourcePath: string;
export declare const DEPENDENCIES: DependencyConfig;
export declare const PORTS: {
    external: number;
    admin: number;
    wormhole: number;
    masterInterface: number;
    publicInterface: number;
    internalInterface: number;
};
export declare const hcDependencyCheck: () => void;
export {};

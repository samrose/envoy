/// <reference types="node" />
export declare const cleanConductorStorage: (baseDir: any) => void;
export declare const initializeConductorConfig: (baseDir: any, keyData: any) => void;
export declare const keygen: (bundlePath?: any) => {
    publicAddress: string;
    keyFile?: undefined;
} | {
    keyFile: string;
    publicAddress: string;
};
export declare const spawnConductor: (baseDir: any) => import("child_process").ChildProcessWithoutNullStreams;

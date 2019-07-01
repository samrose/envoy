export declare type InstanceInfo = {
    agentId: string;
    dnaHash: string;
    type: InstanceType;
};
export declare enum InstanceType {
    Public = 0,
    Hosted = 1
}
export declare type HappID = string;
export declare type KeyData = {
    keyFile: string;
    publicAddress: string;
};
export interface HappStoreResource {
    location: string;
    hash: string;
}
export declare type HappStoreUiResource = HappStoreResource;
export declare type HappStoreDnaResource = HappStoreResource & {
    handle: string;
};
export interface HappStoreEntry {
    dnas: Array<HappStoreDnaResource>;
    ui?: HappStoreUiResource;
}

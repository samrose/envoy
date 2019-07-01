declare const _default: (resourcePath: string) => {
    holochainVersion: string;
    resources: {
        serviceLogger: {
            dna: {
                location: string;
                path: string;
            };
        };
        holofuel: {
            dna: {
                location: string;
                path: string;
            };
            ui: {
                location: string;
                path: string;
                port: number;
            };
        };
        holoHosting: {
            dna: {
                location: string;
                path: string;
            };
            ui: {
                location: string;
                path: string;
                port: number;
            };
        };
        happStore: {
            dna: {
                location: string;
                path: string;
            };
            ui: {
                location: string;
                path: string;
                port: number;
            };
        };
    };
    testResources: {
        basicChat: {
            dna: {
                location: string;
            };
            ui: {
                location: string;
            };
        };
    };
};
export default _default;

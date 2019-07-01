/**
 * Specifies a named list of "connections" to manage.
 * Allows you to manually add or remove them from the set of established connections.
 * When all connections have finally been added, runs onStart
 * When any connection is lost, run onStop
 */
export default class ConnectionManager {
    current: Set<string>;
    target: Set<String>;
    onStart: any;
    onStop: any;
    promise: any;
    promiseResolve: any;
    constructor(opts: {
        connections: Array<String>;
        onStart: any;
        onStop: any;
    });
    _setPromise(): void;
    add(name: string): void;
    remove(name: string): void;
    ready(): any;
    isReady(): boolean;
    update(fn: any): void;
    dismantle(): Promise<void>;
}

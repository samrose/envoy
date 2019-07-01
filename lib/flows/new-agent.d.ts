import { HappID } from '../types';
export declare type NewAgentRequest = {
    agentId: string;
    happId: HappID;
    signature: string;
};
export declare type NewAgentResponse = void;
declare const _default: (masterClient: any) => ({ agentId, happId, signature, }: NewAgentRequest) => Promise<void>;
export default _default;
export declare const createAgent: (masterClient: any, agentId: any) => Promise<void>;

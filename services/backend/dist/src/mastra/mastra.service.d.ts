import { OnModuleInit } from '@nestjs/common';
import { Mastra } from '@mastra/core';
export declare class MastraService implements OnModuleInit {
    private mastra;
    onModuleInit(): void;
    getMastra(): Mastra;
    getAgentById(id: string): import("@mastra/core/agent").Agent<any, import("@mastra/core/agent").ToolsInput, undefined, unknown>;
}

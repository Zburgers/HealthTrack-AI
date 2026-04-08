import { Mastra } from '@mastra/core';
export declare const mastra: Mastra<{
    patientAnalysisAgent: import("@mastra/core/agent").Agent<"patient-analysis-agent", {
        patientSearchTool: import("@mastra/core/tools").Tool<InferPublicSchema<T>, InferPublicSchema<T>, InferPublicSchema<T>, InferPublicSchema<T>, import("@mastra/core/tools").ToolExecutionContext<InferPublicSchema<T>, InferPublicSchema<T>, unknown>, "patient-search", unknown>;
    }, undefined, unknown>;
}, Record<string, import("@mastra/core/dist/workflows").AnyWorkflow>, Record<string, import("@mastra/core/dist/vector").MastraVector<any>>, Record<string, import("@mastra/core/dist/tts").MastraTTS>, import("@mastra/core/dist/logger").IMastraLogger, Record<string, import("@mastra/core/dist/mcp").MCPServerBase<any>>, Record<string, import("@mastra/core/dist/evals").MastraScorer<any, any, any, any>>, Record<string, import("@mastra/core/tools").ToolAction<any, any, any, any, any, any, unknown>>, Record<string, import("@mastra/core/dist/processors").Processor<any, unknown>>, Record<string, import("@mastra/core/dist/memory").MastraMemory>>;

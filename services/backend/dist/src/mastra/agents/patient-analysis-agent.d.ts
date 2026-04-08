import { Agent } from '@mastra/core/agent';
export declare const patientAnalysisAgent: Agent<"patient-analysis-agent", {
    patientSearchTool: import("@mastra/core/tools").Tool<InferPublicSchema<T>, InferPublicSchema<T>, InferPublicSchema<T>, InferPublicSchema<T>, import("@mastra/core/tools").ToolExecutionContext<InferPublicSchema<T>, InferPublicSchema<T>, unknown>, "patient-search", unknown>;
}, undefined, unknown>;

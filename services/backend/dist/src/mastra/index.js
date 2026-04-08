"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mastra = void 0;
const core_1 = require("@mastra/core");
const patient_analysis_agent_1 = require("./agents/patient-analysis-agent");
exports.mastra = new core_1.Mastra({
    agents: { patientAnalysisAgent: patient_analysis_agent_1.patientAnalysisAgent },
});
//# sourceMappingURL=index.js.map
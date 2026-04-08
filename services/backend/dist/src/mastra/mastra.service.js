"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MastraService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@mastra/core");
const patient_analysis_agent_1 = require("./agents/patient-analysis-agent");
const soap_notes_agent_1 = require("./agents/soap-notes-agent");
let MastraService = class MastraService {
    onModuleInit() {
        this.mastra = new core_1.Mastra({
            agents: { patientAnalysisAgent: patient_analysis_agent_1.patientAnalysisAgent, soapNotesAgent: soap_notes_agent_1.soapNotesAgent },
        });
    }
    getMastra() {
        return this.mastra;
    }
    getAgentById(id) {
        return this.mastra.getAgentById(id);
    }
};
exports.MastraService = MastraService;
exports.MastraService = MastraService = __decorate([
    (0, common_1.Injectable)()
], MastraService);
//# sourceMappingURL=mastra.service.js.map
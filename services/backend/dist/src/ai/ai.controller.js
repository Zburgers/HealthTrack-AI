"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIController = void 0;
const common_1 = require("@nestjs/common");
const mastra_service_1 = require("../mastra/mastra.service");
const clerk_auth_guard_1 = require("../auth/guards/clerk-auth.guard");
const org_scoped_guard_1 = require("../auth/guards/org-scoped.guard");
let AIController = class AIController {
    constructor(mastraService) {
        this.mastraService = mastraService;
    }
    async analyzePatient(input) {
        const agent = this.mastraService.getAgentById('patient-analysis-agent');
        const prompt = this.buildAnalysisPrompt(input);
        const response = await agent.generate(prompt);
        return { analysis: response.text };
    }
    async enhanceNotes(input) {
        const agent = this.mastraService.getAgentById('soap-notes-agent');
        const prompt = this.buildEnhancePrompt(input);
        const response = await agent.generate(prompt);
        return { enhancedNotes: response.text };
    }
    buildAnalysisPrompt(input) {
        return `
      Analyze the following patient data and provide a clinical assessment:

      Patient Information:
      ${JSON.stringify(input.patientInformation, null, 2)}

      Symptoms:
      ${JSON.stringify(input.symptoms, null, 2)}

      ${input.medicalHistory ? `Medical History: ${input.medicalHistory}` : ''}
      ${input.currentMedications ? `Current Medications: ${input.currentMedications}` : ''}

      Please provide:
      1. Differential diagnoses with likelihood assessments
      2. Recommended next steps (labs, imaging, referrals)
      3. Relevant ICD-10 code suggestions
      4. Risk assessment and urgency level
    `;
    }
    buildEnhancePrompt(input) {
        return `
      Enhance the following SOAP notes for clinical documentation quality:

      Subjective: ${input.subjective || 'Not provided'}
      Objective: ${input.objective || 'Not provided'}
      Assessment: ${input.assessment || 'Not provided'}
      Plan: ${input.plan || 'Not provided'}

      Enhancement type: ${input.enhancementType || 'full'}

      Please:
      1. Enhance each section with appropriate clinical detail
      2. Use standard medical terminology
      3. Suggest relevant ICD-10 codes
      4. Identify any documentation gaps
    `;
    }
};
exports.AIController = AIController;
__decorate([
    (0, common_1.Post)('analyze'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "analyzePatient", null);
__decorate([
    (0, common_1.Post)('enhance-notes'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "enhanceNotes", null);
exports.AIController = AIController = __decorate([
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard, org_scoped_guard_1.OrgScopedGuard),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [mastra_service_1.MastraService])
], AIController);
//# sourceMappingURL=ai.controller.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MastraModule = void 0;
const common_1 = require("@nestjs/common");
const mastra_service_1 = require("./mastra.service");
let MastraModule = class MastraModule {
};
exports.MastraModule = MastraModule;
exports.MastraModule = MastraModule = __decorate([
    (0, common_1.Module)({
        providers: [mastra_service_1.MastraService],
        exports: [mastra_service_1.MastraService],
    })
], MastraModule);
//# sourceMappingURL=mastra.module.js.map
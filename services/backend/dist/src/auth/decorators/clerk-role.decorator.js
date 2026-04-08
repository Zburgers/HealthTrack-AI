"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireClerkRole = exports.CLERK_ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.CLERK_ROLES_KEY = 'clerkRoles';
const RequireClerkRole = (...roles) => (0, common_1.SetMetadata)(exports.CLERK_ROLES_KEY, roles);
exports.RequireClerkRole = RequireClerkRole;
//# sourceMappingURL=clerk-role.decorator.js.map
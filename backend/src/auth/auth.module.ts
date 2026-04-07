import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { OrgScopedGuard } from './guards/org-scoped.guard';
import { RoleGuard } from './guards/role.guard';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, ClerkAuthGuard, OrgScopedGuard, RoleGuard],
  exports: [AuthService, ClerkAuthGuard, OrgScopedGuard, RoleGuard],
})
export class AuthModule {}

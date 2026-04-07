import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // TODO: Implement proper JWT guard with Firebase verification
    const request = context.switchToHttp().getRequest();
    return !!request.headers?.authorization;
  }
}

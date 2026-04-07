import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase-jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
    });
  }

  async validate(payload: unknown) {
    // Firebase tokens are verified separately; this is a placeholder
    return { userId: (payload as Record<string, unknown>).uid, email: (payload as Record<string, unknown>).email };
  }
}

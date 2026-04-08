import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { DatabaseModule } from './database/database.module';
// Note: AIModule disabled due to Mastra ESM/CJS compatibility issue
// import { AIModule } from './ai/ai.module';
import { CaseDetailsModule } from './case-details/case-details.module';
import { SimilarCasesModule } from './similar-cases/similar-cases.module';
import { ExportModule } from './export/export.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    // AIModule, // Disabled - ESM compatibility issue with @mastra/core
    CaseDetailsModule,
    SimilarCasesModule,
    ExportModule,
    EmbeddingsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

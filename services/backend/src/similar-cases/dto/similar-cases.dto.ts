import { IsNumber, IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class SimilarCaseSearchDto {
  @IsOptional()
  @IsString()
  patientInformation?: string;

  @IsOptional()
  @IsObject()
  vitals?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diagnoses?: string[];

  @IsOptional()
  @IsString()
  clinicalNote?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  minConfidence?: number;
}

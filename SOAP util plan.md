# SOAP Notes Utility Migration Plan

## Overview
This document outlines the migration plan to consolidate all SOAP notes parsing, validation, and formatting logic into a single utility module (`src/lib/soap-parser.ts`) for improved maintainability, consistency, and performance.

## Current State Analysis

### ✅ COMPLETED
- **Core Parser Module**: `src/lib/soap-parser.ts` - Robust multi-format SOAP parser with error handling
- **Test Script**: `test-soap-parser.js` - Validates parser functionality
- **AI Enhancement**: Updated vertex-ai prompts to output strict SOAP format

### 🔄 PARTIALLY MIGRATED
The following components have been updated to use improved SOAP parsing logic but still contain custom parsing code:

1. **Analysis Page** (`src/app/analysis/page.tsx`)
   - ✅ Uses improved regex patterns
   - 🔄 Has custom parsing logic that should use the utility
   - 🔄 Contains SOAP validation and formatting logic

2. **Patient Detail Page** (`src/app/dashboard/patient/[id]/page.tsx`)
   - ✅ Has `ParsedSoapNotesDisplay` component with parsing
   - 🔄 Uses custom parsing logic instead of utility
   - 🔄 Contains error handling that duplicates utility functionality

3. **SOAP Notes Editor** (`src/components/results/SoapNotesEditor.tsx`)
   - ✅ Has validation and AI enhancement integration
   - 🔄 Contains custom SOAP parsing and validation logic
   - 🔄 Should use utility for consistency

### ❌ NOT MIGRATED
1. **API Route** (`src/app/api/patients/[id]/route.ts`)
   - Contains custom `formatSoapNote` and `createStructuredSoapNotes` functions
   - Should use utility formatting functions

2. **Other Components** (To be identified during migration)

## Migration Steps

### Phase 1: Migrate API Route SOAP Logic
1. **Replace `formatSoapNote`** function with `soap-parser` utility
2. **Replace `createStructuredSoapNotes`** with utility formatting functions
3. **Add error handling** using utility's validation
4. **Test API** responses

### Phase 2: Migrate UI Components
1. **Analysis Page** (`src/app/analysis/page.tsx`)
   - Replace custom parsing with `parseSOAPNotes()`
   - Use utility's error reporting
   - Implement utility's formatting functions

2. **Patient Detail Page** (`src/app/dashboard/patient/[id]/page.tsx`)
   - Update `ParsedSoapNotesDisplay` to use utility
   - Remove duplicate parsing logic
   - Use utility's validation and error handling

3. **SOAP Notes Editor** (`src/components/results/SoapNotesEditor.tsx`)
   - Replace validation logic with utility functions
   - Use utility's formatting for consistency
   - Integrate utility's error reporting

### Phase 3: Performance Optimization
1. **Async Parsing**: Convert parser to Promise-based for large notes
2. **Caching**: Add memoization for frequently parsed notes
3. **Streaming**: Support progressive parsing for real-time editing

### Phase 4: Documentation & Testing
1. **API Documentation**: Update with new SOAP handling
2. **Component Documentation**: Document utility usage
3. **Integration Tests**: Comprehensive SOAP workflow testing
4. **Error Scenarios**: Test edge cases and error handling

## Detailed Migration Instructions

### 1. API Route Migration

**File**: `src/app/api/patients/[id]/route.ts`

**Current Code**:
```typescript
const formatSoapNote = (soap: PatientDocument['soap_note']) => {
  // Custom formatting logic
};

const createStructuredSoapNotes = (soap: PatientDocument['soap_note']) => {
  // Custom SOAP creation logic
};
```

**New Code**:
```typescript
import { parseSOAPNotes, formatToTraditionalFormat, formatToXMLFormat } from '@/lib/soap-parser';

// Replace formatSoapNote usage with:
const soapText = formatToTraditionalFormat({
  subjective: patient.soap_note?.subjective || '',
  objective: patient.soap_note?.objective || '',
  assessment: patient.soap_note?.assessment || '',
  plan: patient.soap_note?.plan || ''
});

// Replace createStructuredSoapNotes with direct formatting
```

### 2. Analysis Page Migration

**File**: `src/app/analysis/page.tsx`

**Replace**:
```typescript
// Custom parsing regex and logic
```

**With**:
```typescript
import { parseSOAPNotes, isValidSOAPFormat } from '@/lib/soap-parser';

const soapResult = parseSOAPNotes(aiAnalysis.soapNotes);
if (soapResult.isValid) {
  // Use soapResult.subjective, .objective, etc.
} else {
  // Display soapResult.errors
}
```

### 3. Patient Detail Page Migration

**File**: `src/app/dashboard/patient/[id]/page.tsx`

**Update** `ParsedSoapNotesDisplay` component:
```typescript
import { parseSOAPNotes } from '@/lib/soap-parser';

const ParsedSoapNotesDisplay: React.FC<{ notes?: string }> = ({ notes }) => {
  const soapResult = parseSOAPNotes(notes || '');
  
  if (!soapResult.isValid) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <div className="text-amber-800">
          <p className="font-semibold text-base mb-2">SOAP parsing issues:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {soapResult.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Render structured sections using soapResult...
};
```

### 4. SOAP Notes Editor Migration

**File**: `src/components/results/SoapNotesEditor.tsx`

**Replace validation logic**:
```typescript
import { parseSOAPNotes, isValidSOAPFormat, formatToXMLFormat } from '@/lib/soap-parser';

// Replace custom validation with:
const isValid = isValidSOAPFormat(notes);
const soapResult = parseSOAPNotes(notes);

// For AI enhancement formatting:
const enhancedNotes = formatToXMLFormat({
  subjective: enhancedData.subjective,
  objective: enhancedData.objective,
  assessment: enhancedData.assessment,
  plan: enhancedData.plan
});
```

## Utility Extensions Needed

### 1. Additional Export Functions
```typescript
// Add to soap-parser.ts
export function getSoapSectionCount(notes: string): number {
  const result = parseSOAPNotes(notes);
  return [result.subjective, result.objective, result.assessment, result.plan]
    .filter(section => section.trim().length > 0).length;
}

export function getSoapValidationSummary(notes: string): {
  isValid: boolean;
  sectionCount: number;
  missingsections: string[];
  format: string;
} {
  const result = parseSOAPNotes(notes);
  const missing = [];
  if (!result.subjective) missing.push('Subjective');
  if (!result.objective) missing.push('Objective');
  if (!result.assessment) missing.push('Assessment');
  if (!result.plan) missing.push('Plan');
  
  return {
    isValid: result.isValid,
    sectionCount: getSoapSectionCount(notes),
    missingSections: missing,
    format: result.format
  };
}
```

### 2. Async Parser Version
```typescript
// For large documents or real-time parsing
export async function parseSOAPNotesAsync(notes: string): Promise<SOAPSections> {
  return new Promise((resolve) => {
    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      resolve(parseSOAPNotes(notes));
    }, 0);
  });
}
```

## Testing Strategy

### 1. Unit Tests
- Test all parsing formats with various inputs
- Test error conditions and edge cases
- Test formatting functions

### 2. Integration Tests
- Test API endpoints with SOAP data flow
- Test UI components with various SOAP formats
- Test AI enhancement workflow

### 3. Migration Validation
- Compare old vs new parsing results
- Verify no functionality regression
- Performance benchmarking

## Rollout Plan

### Week 1: Foundation
- [x] Fix TypeScript error in API route
- [ ] Complete API route SOAP migration
- [ ] Create additional utility functions

### Week 2: UI Migration
- [ ] Migrate Analysis page
- [ ] Migrate Patient detail page
- [ ] Migrate SOAP Notes Editor

### Week 3: Testing & Optimization
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation updates

## Success Criteria

1. **Consistency**: All SOAP parsing uses single utility
2. **Performance**: No regression in parsing speed
3. **Reliability**: Better error handling and validation
4. **Maintainability**: Single source of truth for SOAP logic
5. **Type Safety**: No TypeScript errors
6. **User Experience**: Improved error messages and feedback

## Risk Mitigation

1. **Gradual Migration**: Phase-by-phase implementation
2. **Backward Compatibility**: Ensure existing data still works
3. **Rollback Plan**: Keep old code until fully validated
4. **Testing Coverage**: Comprehensive test suite
5. **Monitoring**: Track errors and performance post-migration

## Next Steps

1. **Immediate**: Fix TypeScript error and test API route
2. **This Week**: Complete API route migration
3. **Next Week**: Begin UI component migration
4. **Following Week**: Testing and optimization phase

---

**Status**: 🔄 In Progress  
**Last Updated**: Current  
**Assigned**: Development Team  
**Priority**: High

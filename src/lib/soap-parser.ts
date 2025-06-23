/**
 * Robust SOAP Notes Parser
 * 
 * This utility provides multiple parsing strategies for SOAP notes,
 * handling both modern structured formats and legacy S:/O:/A:/P: formats.
 */

export interface SOAPSections {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  isValid: boolean;
  errors: string[];
  format: 'xml' | 'traditional' | 'enhanced' | 'unknown';
}

/**
 * Parse XML-like SOAP format
 * Example: <SUBJECTIVE>content</SUBJECTIVE>
 */
function parseXMLFormat(notes: string): SOAPSections {
  const errors: string[] = [];
  const sections = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    isValid: false,
    errors,
    format: 'xml' as const
  };

  try {
    // Extract each section using regex
    const subjectiveMatch = notes.match(/<SUBJECTIVE>([\s\S]*?)<\/SUBJECTIVE>/i);
    const objectiveMatch = notes.match(/<OBJECTIVE>([\s\S]*?)<\/OBJECTIVE>/i);
    const assessmentMatch = notes.match(/<ASSESSMENT>([\s\S]*?)<\/ASSESSMENT>/i);
    const planMatch = notes.match(/<PLAN>([\s\S]*?)<\/PLAN>/i);

    sections.subjective = subjectiveMatch?.[1]?.trim() || '';
    sections.objective = objectiveMatch?.[1]?.trim() || '';
    sections.assessment = assessmentMatch?.[1]?.trim() || '';
    sections.plan = planMatch?.[1]?.trim() || '';

    // Validate that all sections are present and have content
    if (!sections.subjective) errors.push('Missing or empty SUBJECTIVE section');
    if (!sections.objective) errors.push('Missing or empty OBJECTIVE section');
    if (!sections.assessment) errors.push('Missing or empty ASSESSMENT section');
    if (!sections.plan) errors.push('Missing or empty PLAN section');

    sections.isValid = errors.length === 0;
    
    return sections;
  } catch (error) {
    errors.push(`XML parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return sections;
  }
}

/**
 * Parse enhanced block format
 * Example: [SUBJECTIVE] content [/SUBJECTIVE]
 */
function parseEnhancedFormat(notes: string): SOAPSections {
  const errors: string[] = [];
  const sections = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    isValid: false,
    errors,
    format: 'enhanced' as const
  };

  try {
    // Try block format like [SUBJECTIVE]...[/SUBJECTIVE]
    let subjectiveMatch = notes.match(/\[SUBJECTIVE\]([\s\S]*?)\[\/SUBJECTIVE\]/i);
    let objectiveMatch = notes.match(/\[OBJECTIVE\]([\s\S]*?)\[\/OBJECTIVE\]/i);
    let assessmentMatch = notes.match(/\[ASSESSMENT\]([\s\S]*?)\[\/ASSESSMENT\]/i);
    let planMatch = notes.match(/\[PLAN\]([\s\S]*?)\[\/PLAN\]/i);

    // If that doesn't work, try simpler [SECTION] format
    if (!subjectiveMatch) {
      const sectionMatches = notes.split(/\[(?:SUBJECTIVE|OBJECTIVE|ASSESSMENT|PLAN)\]/i);
      if (sectionMatches.length >= 5) {
        sections.subjective = sectionMatches[1]?.trim() || '';
        sections.objective = sectionMatches[2]?.trim() || '';
        sections.assessment = sectionMatches[3]?.trim() || '';
        sections.plan = sectionMatches[4]?.trim() || '';
      }
    } else {
      sections.subjective = subjectiveMatch?.[1]?.trim() || '';
      sections.objective = objectiveMatch?.[1]?.trim() || '';
      sections.assessment = assessmentMatch?.[1]?.trim() || '';
      sections.plan = planMatch?.[1]?.trim() || '';
    }

    // Validate sections
    if (!sections.subjective) errors.push('Missing or empty SUBJECTIVE section');
    if (!sections.objective) errors.push('Missing or empty OBJECTIVE section');
    if (!sections.assessment) errors.push('Missing or empty ASSESSMENT section');
    if (!sections.plan) errors.push('Missing or empty PLAN section');

    sections.isValid = errors.length === 0;
    return sections;
  } catch (error) {
    errors.push(`Enhanced parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return sections;
  }
}

/**
 * Parse traditional S:/O:/A:/P: format (improved version)
 */
function parseTraditionalFormat(notes: string): SOAPSections {
  const errors: string[] = [];
  const sections = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    isValid: false,
    errors,
    format: 'traditional' as const
  };

  try {
    // More robust regex that looks for section headers at line boundaries
    // and handles the content until the next section or end of string
    const subjectiveMatch = notes.match(/(?:^|\n)\s*S\s*:\s*([\s\S]*?)(?=(?:\n\s*[OAP]\s*:)|$)/i);
    const objectiveMatch = notes.match(/(?:^|\n)\s*O\s*:\s*([\s\S]*?)(?=(?:\n\s*[AP]\s*:)|$)/i);
    const assessmentMatch = notes.match(/(?:^|\n)\s*A\s*:\s*([\s\S]*?)(?=(?:\n\s*P\s*:)|$)/i);
    const planMatch = notes.match(/(?:^|\n)\s*P\s*:\s*([\s\S]*)$/i);

    sections.subjective = subjectiveMatch?.[1]?.trim() || '';
    sections.objective = objectiveMatch?.[1]?.trim() || '';
    sections.assessment = assessmentMatch?.[1]?.trim() || '';
    sections.plan = planMatch?.[1]?.trim() || '';

    // Remove any trailing content that might be part of the next section
    sections.subjective = cleanTraditionalSection(sections.subjective, ['O:', 'A:', 'P:']);
    sections.objective = cleanTraditionalSection(sections.objective, ['A:', 'P:']);
    sections.assessment = cleanTraditionalSection(sections.assessment, ['P:']);

    // Validate that we found the basic structure
    const hasBasicStructure = notes.includes('S:') && notes.includes('O:') && 
                             notes.includes('A:') && notes.includes('P:');
    
    if (!hasBasicStructure) {
      errors.push('Missing SOAP section headers (S:, O:, A:, P:)');
    }

    // Check for content in each section
    if (!sections.subjective && hasBasicStructure) errors.push('Empty SUBJECTIVE section');
    if (!sections.objective && hasBasicStructure) errors.push('Empty OBJECTIVE section');
    if (!sections.assessment && hasBasicStructure) errors.push('Empty ASSESSMENT section');
    if (!sections.plan && hasBasicStructure) errors.push('Empty PLAN section');

    sections.isValid = hasBasicStructure && errors.length === 0;
    return sections;
  } catch (error) {
    errors.push(`Traditional parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return sections;
  }
}

/**
 * Clean traditional section content by removing trailing section headers
 */
function cleanTraditionalSection(content: string, stopMarkers: string[]): string {
  let cleaned = content;
  
  for (const marker of stopMarkers) {
    const markerIndex = cleaned.lastIndexOf(marker);
    if (markerIndex > 0) {
      // Check if it's at the start of a line (likely a new section)
      const beforeMarker = cleaned.substring(0, markerIndex);
      const lastNewline = beforeMarker.lastIndexOf('\n');
      const lineContent = beforeMarker.substring(lastNewline + 1).trim();
      
      if (lineContent === '') {
        // The marker is at the start of a line, so cut there
        cleaned = beforeMarker;
      }
    }
  }
  
  return cleaned.trim();
}

/**
 * Main parser function - tries multiple formats
 */
export function parseSOAPNotes(notes: string): SOAPSections {
  if (!notes || notes.trim() === '') {
    return {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      isValid: false,
      errors: ['No notes provided'],
      format: 'unknown'
    };
  }

  // Try XML format first (most robust)
  const xmlResult = parseXMLFormat(notes);
  if (xmlResult.isValid) {
    return xmlResult;
  }

  // Try enhanced block format
  const enhancedResult = parseEnhancedFormat(notes);
  if (enhancedResult.isValid) {
    return enhancedResult;
  }

  // Fallback to traditional format
  const traditionalResult = parseTraditionalFormat(notes);
  
  // If traditional format also fails, return the best attempt with all errors
  if (!traditionalResult.isValid) {
    traditionalResult.errors = [
      ...xmlResult.errors,
      ...enhancedResult.errors,
      ...traditionalResult.errors
    ];
  }

  return traditionalResult;
}

/**
 * Format SOAP sections back to XML format
 */
export function formatToXMLFormat(sections: Partial<SOAPSections>): string {
  const { subjective = '', objective = '', assessment = '', plan = '' } = sections;
  
  return `<SUBJECTIVE>
${subjective}
</SUBJECTIVE>

<OBJECTIVE>
${objective}
</OBJECTIVE>

<ASSESSMENT>
${assessment}
</ASSESSMENT>

<PLAN>
${plan}
</PLAN>`;
}

/**
 * Format SOAP sections back to traditional format
 */
export function formatToTraditionalFormat(sections: Partial<SOAPSections>): string {
  const { subjective = '', objective = '', assessment = '', plan = '' } = sections;
  
  return `S: ${subjective}

O: ${objective}

A: ${assessment}

P: ${plan}`;
}

/**
 * Validate if notes contain proper SOAP structure (any format)
 */
export function isValidSOAPFormat(notes: string): boolean {
  const result = parseSOAPNotes(notes);
  return result.isValid;
}

/**
 * Get the number of non-empty SOAP sections
 */
export function getSoapSectionCount(notes: string): number {
  const result = parseSOAPNotes(notes);
  return [result.subjective, result.objective, result.assessment, result.plan]
    .filter(section => section.trim().length > 0).length;
}

/**
 * Get detailed validation summary for SOAP notes
 */
export function getSoapValidationSummary(notes: string): {
  isValid: boolean;
  sectionCount: number;
  missingSections: string[];
  format: string;
} {
  const result = parseSOAPNotes(notes);
  const missing = [];
  if (!result.subjective.trim()) missing.push('Subjective');
  if (!result.objective.trim()) missing.push('Objective');
  if (!result.assessment.trim()) missing.push('Assessment');
  if (!result.plan.trim()) missing.push('Plan');
  
  return {
    isValid: result.isValid,
    sectionCount: getSoapSectionCount(notes),
    missingSections: missing,
    format: result.format
  };
}

/**
 * Async version of SOAP parser for large documents or non-blocking operations
 */
export async function parseSOAPNotesAsync(notes: string): Promise<SOAPSections> {
  return new Promise((resolve) => {
    // Use setTimeout to avoid blocking UI thread
    setTimeout(() => {
      resolve(parseSOAPNotes(notes));
    }, 0);
  });
}

/**
 * Create structured SOAP notes from individual sections
 */
export function createStructuredSoapNotes(sections: {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}): SOAPSections {
  const { subjective = '', objective = '', assessment = '', plan = '' } = sections;
  
  const errors: string[] = [];
  if (!subjective.trim()) errors.push('Missing or empty SUBJECTIVE section');
  if (!objective.trim()) errors.push('Missing or empty OBJECTIVE section');
  if (!assessment.trim()) errors.push('Missing or empty ASSESSMENT section');
  if (!plan.trim()) errors.push('Missing or empty PLAN section');

  return {
    subjective: subjective.trim(),
    objective: objective.trim(),
    assessment: assessment.trim(),
    plan: plan.trim(),
    isValid: errors.length === 0,
    errors,
    format: 'xml'
  };
}

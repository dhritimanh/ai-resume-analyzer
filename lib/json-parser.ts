/**
 * Robust JSON parser for LLM responses
 * Handles common issues like markdown code blocks, unterminated strings, etc.
 */

/**
 * Extract and parse JSON from LLM response
 * Handles various edge cases and malformed JSON
 */
export function parseJsonFromLLM(rawResponse: string): any {
  let cleaned = rawResponse.trim();
  
  // Remove markdown code blocks
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
  
  // Try to find JSON object boundaries
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  // Remove any trailing text after the last }
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1) {
    cleaned = cleaned.substring(0, lastBrace + 1);
  }
  
  // Try parsing
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.log('Initial JSON parse failed, attempting repairs...');
    // If parsing fails, try to fix common issues
    return tryFixAndParse(cleaned);
  }
}

/**
 * Attempt to fix common JSON issues and parse
 */
function tryFixAndParse(jsonStr: string): any {
  let fixed = jsonStr;
  
  // Strategy 1: Find the last valid complete object/array
  const lastValidJson = findLastValidJson(jsonStr);
  if (lastValidJson) {
    try {
      console.log('Found valid JSON by truncating at last complete structure');
      return JSON.parse(lastValidJson);
    } catch (e) {
      // Continue to other strategies
    }
  }
  
  // Strategy 2: Fix control characters
  fixed = fixControlCharacters(fixed);
  
  // Strategy 3: Fix unterminated strings
  fixed = fixUnterminatedStrings(fixed);
  
  // Strategy 4: Fix unterminated arrays and objects
  fixed = fixUnterminatedArrays(fixed);
  
  // Try parsing again
  try {
    console.log('Attempted to fix unterminated JSON');
    return JSON.parse(fixed);
  } catch (error) {
    console.error('JSON parsing failed even after fixes:', error);
    console.error('Problematic JSON (first 500 chars):', jsonStr.substring(0, 500) + '...');
    console.error('Problematic JSON (last 500 chars):', '...' + jsonStr.substring(Math.max(0, jsonStr.length - 500)));
    throw new Error('Failed to parse JSON response from AI - response may be truncated');
  }
}

/**
 * Find the last valid complete JSON structure by walking backwards
 */
function findLastValidJson(jsonStr: string): string | null {
  // Find all closing braces and try parsing from each one backwards
  const closingBraces: number[] = [];
  for (let i = jsonStr.length - 1; i >= 0; i--) {
    if (jsonStr[i] === '}') {
      closingBraces.push(i);
    }
  }
  
  // Try each closing brace position
  for (const pos of closingBraces) {
    const candidate = jsonStr.substring(0, pos + 1);
    try {
      JSON.parse(candidate);
      return candidate; // Found valid JSON!
    } catch (e) {
      // Not valid, try next position
    }
  }
  
  return null;
}

/**
 * Fix control characters in JSON strings
 * Replaces literal newlines, tabs, etc. with escaped versions
 */
function fixControlCharacters(jsonStr: string): string {
  let fixed = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    if (escapeNext) {
      fixed += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      fixed += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      fixed += char;
      continue;
    }
    
    // If we're inside a string, escape control characters
    if (inString) {
      if (char === '\n') {
        fixed += '\\n';
      } else if (char === '\r') {
        fixed += '\\r';
      } else if (char === '\t') {
        fixed += '\\t';
      } else if (char.charCodeAt(0) < 32) {
        // Other control characters - skip them
        continue;
      } else {
        fixed += char;
      }
    } else {
      fixed += char;
    }
  }
  
  return fixed;
}

/**
 * Fix unterminated strings in JSON
 */
function fixUnterminatedStrings(jsonStr: string): string {
  // Strategy: Find the last valid closing brace and truncate there
  // This handles cases where JSON is cut off mid-string
  
  let depth = 0;
  let lastValidIndex = -1;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    // Handle escape sequences
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    // Track if we're inside a string
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    // Only count braces outside of strings
    if (!inString) {
      if (char === '{' || char === '[') {
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
        if (depth === 0) {
          lastValidIndex = i;
        }
      }
    }
  }
  
  // If we found a valid closing point, truncate there
  if (lastValidIndex > 0) {
    const truncated = jsonStr.substring(0, lastValidIndex + 1);
    console.log(`Truncated JSON from ${jsonStr.length} to ${truncated.length} characters`);
    return truncated;
  }
  
  // If no valid closing found, try to close any open strings and objects
  let fixed = jsonStr;
  
  // If we're in a string, close it
  if (inString) {
    fixed += '"';
  }
  
  // Close any open braces
  while (depth > 0) {
    fixed += '}';
    depth--;
  }
  
  console.log('Attempted to fix unterminated JSON');
  return fixed;
}

/**
 * Parse JSON with fallback to default value
 */
export function parseJsonSafe<T>(rawResponse: string, defaultValue: T): T {
  try {
    return parseJsonFromLLM(rawResponse);
  } catch (error) {
    console.error('JSON parsing failed, using default value');
    return defaultValue;
  }
}

/**
 * Fix unterminated arrays in JSON
 */
function fixUnterminatedArrays(jsonStr: string): string {
  let fixed = jsonStr;
  let inString = false;
  let escapeNext = false;
  let arrayDepth = 0;
  let objectDepth = 0;
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '[') arrayDepth++;
      if (char === ']') arrayDepth--;
      if (char === '{') objectDepth++;
      if (char === '}') objectDepth--;
    }
  }
  
  // Close any unclosed arrays and objects
  while (arrayDepth > 0) {
    fixed += ']';
    arrayDepth--;
  }
  
  while (objectDepth > 0) {
    fixed += '}';
    objectDepth--;
  }
  
  return fixed;
}

/**
 * Validate that parsed JSON has required fields
 */
export function validateJsonStructure(data: any, requiredFields: string[]): boolean {
  for (const field of requiredFields) {
    if (!(field in data)) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }
  return true;
}

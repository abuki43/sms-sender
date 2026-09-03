export interface ParsedContact {
  name: string;
  phone: string;
  customFields?: Record<string, string>;
}

export interface ParseResult {
  contacts: ParsedContact[];
  totalParsed: number;
  duplicateCount: number;
  invalidCount: number;
}

/**
 * Sanitizes phone numbers by stripping whitespace, dashes, dots, and brackets.
 * Preserves leading '+' if present.
 */
export function sanitizePhoneNumber(raw: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (!digitsOnly) return "";
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Validates if a cleaned string is a plausible phone number (7 to 15 digits).
 */
export function isValidPhoneNumber(cleaned: string): boolean {
  const digits = cleaned.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Auto-detects delimiter among comma, semicolon, tab, and pipe.
 */
function detectDelimiter(firstLine: string): string {
  const counts: Record<string, number> = {
    ",": (firstLine.match(/,/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
    "|": (firstLine.match(/\|/g) || []).length,
  };
  let best = ",";
  let max = 0;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      best = delim;
    }
  }
  return best;
}

/**
 * Splits a single CSV row respecting quoted values containing delimiters.
 */
function splitCsvRow(row: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (insideQuotes && row[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const NAME_HEADER_KEYWORDS = [
  "name",
  "full_name",
  "fullname",
  "contact",
  "contact_name",
  "customer",
  "first_name",
  "client",
  "person",
];

const PHONE_HEADER_KEYWORDS = [
  "phone",
  "phone_number",
  "phonenumber",
  "mobile",
  "cell",
  "tel",
  "telephone",
  "contact_number",
  "number",
];

/**
 * Parses raw CSV string content into a deduplicated list of valid contacts,
 * preserving all extra custom columns (e.g. Amount, DueDate, City, Code) for templating.
 */
export function parseCsvContacts(csvText: string): ParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { contacts: [], totalParsed: 0, duplicateCount: 0, invalidCount: 0 };
  }

  const delimiter = detectDelimiter(lines[0]);
  const rawHeaders = splitCsvRow(lines[0], delimiter);

  let nameColIndex = -1;
  let phoneColIndex = -1;
  let startIndex = 0;

  // Check if first row is a header
  rawHeaders.forEach((cell, idx) => {
    const cleanCell = cell.toLowerCase().replace(/[\s_-]/g, "");
    if (NAME_HEADER_KEYWORDS.some((k) => cleanCell.includes(k.replace(/_/g, "")))) {
      if (nameColIndex === -1) nameColIndex = idx;
    }
    if (PHONE_HEADER_KEYWORDS.some((k) => cleanCell.includes(k.replace(/_/g, "")))) {
      if (phoneColIndex === -1) phoneColIndex = idx;
    }
  });

  const hasHeader = nameColIndex !== -1 || phoneColIndex !== -1;

  if (hasHeader) {
    startIndex = 1;
    if (phoneColIndex === -1 && rawHeaders.length === 1) {
      phoneColIndex = 0;
    }
  } else {
    // No header detected. Examine first data row to deduce column types.
    if (rawHeaders.length === 1) {
      phoneColIndex = 0;
    } else {
      // Find which column looks like a phone number
      const c0Clean = sanitizePhoneNumber(rawHeaders[0]);
      const c1Clean = sanitizePhoneNumber(rawHeaders[1] || "");

      if (isValidPhoneNumber(c0Clean) && !isValidPhoneNumber(c1Clean)) {
        phoneColIndex = 0;
        nameColIndex = 1;
      } else {
        nameColIndex = 0;
        phoneColIndex = 1;
      }
    }
  }

  const seenPhones = new Set<string>();
  const validContacts: ParsedContact[] = [];
  let duplicateCount = 0;
  let invalidCount = 0;

  for (let i = startIndex; i < lines.length; i++) {
    const cells = splitCsvRow(lines[i], delimiter);
    if (cells.length === 0 || cells.every((c) => !c)) continue;

    let rawPhone = phoneColIndex !== -1 && cells[phoneColIndex] ? cells[phoneColIndex] : "";
    let rawName = nameColIndex !== -1 && cells[nameColIndex] ? cells[nameColIndex] : "";

    // If phoneCol was undefined or blank, search other cells for a valid phone number
    if (!isValidPhoneNumber(sanitizePhoneNumber(rawPhone))) {
      for (let c = 0; c < cells.length; c++) {
        const candidate = sanitizePhoneNumber(cells[c]);
        if (isValidPhoneNumber(candidate)) {
          rawPhone = cells[c];
          if (nameColIndex === -1) {
            rawName = cells[c === 0 ? 1 : 0] || "";
          }
          break;
        }
      }
    }

    const cleanPhone = sanitizePhoneNumber(rawPhone);

    if (!isValidPhoneNumber(cleanPhone)) {
      invalidCount++;
      continue;
    }

    if (seenPhones.has(cleanPhone)) {
      duplicateCount++;
      continue;
    }

    seenPhones.add(cleanPhone);
    const finalName = rawName.trim() || `Contact ${validContacts.length + 1}`;

    // Extract all additional columns as customFields
    const customFields: Record<string, string> = {};
    if (hasHeader) {
      rawHeaders.forEach((headerName, idx) => {
        if (idx !== nameColIndex && idx !== phoneColIndex && headerName.trim()) {
          const val = cells[idx] ? cells[idx].trim() : "";
          if (val) {
            customFields[headerName.trim()] = val;
          }
        }
      });
    }

    validContacts.push({
      name: finalName,
      phone: cleanPhone,
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
    });
  }

  return {
    contacts: validContacts,
    totalParsed: validContacts.length,
    duplicateCount,
    invalidCount,
  };
}

/**
 * Parses raw text input pasted by user (multi-column CSV, TSV, or "Name - Phone" lines).
 */
export function parsePastedContacts(rawText: string): ParseResult {
  if (!rawText.trim()) {
    return { contacts: [], totalParsed: 0, duplicateCount: 0, invalidCount: 0 };
  }

  // 1. If text has multi-column format (commas, semicolons, tabs, or headers), try parseCsvContacts first
  const csvAttempt = parseCsvContacts(rawText);
  if (csvAttempt.contacts.length > 0) {
    return csvAttempt;
  }

  // 2. Fallback to line-by-line regex parsing
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const seenPhones = new Set<string>();
  const validContacts: ParsedContact[] = [];
  let duplicateCount = 0;
  let invalidCount = 0;

  for (const line of lines) {
    // Check if line contains a separator between name and phone like "-", ",", ":", or tab
    const splitMatch = line.match(/^(.*?)\s*[-:,|\t]\s*(\+?[\d\s()\-]{7,20})$/);

    let name = "";
    let phoneStr = "";

    if (splitMatch) {
      name = splitMatch[1].trim();
      phoneStr = splitMatch[2].trim();
    } else {
      // Check if the entire line is a phone number
      const candidatePhone = sanitizePhoneNumber(line);
      if (isValidPhoneNumber(candidatePhone)) {
        phoneStr = line;
      } else {
        // Search for any sequence of 7-15 digits in the line
        const digitsMatch = line.match(/\+?\d[\d\s()\-]{6,}\d/);
        if (digitsMatch) {
          phoneStr = digitsMatch[0];
          name = line.replace(digitsMatch[0], "").trim();
        }
      }
    }

    const cleanPhone = sanitizePhoneNumber(phoneStr);

    if (!isValidPhoneNumber(cleanPhone)) {
      invalidCount++;
      continue;
    }

    if (seenPhones.has(cleanPhone)) {
      duplicateCount++;
      continue;
    }

    seenPhones.add(cleanPhone);
    const finalName = name.replace(/^[-:,|\t]+|[-:,|\t]+$/g, "").trim() || `Contact ${validContacts.length + 1}`;
    validContacts.push({ name: finalName, phone: cleanPhone });
  }

  return {
    contacts: validContacts,
    totalParsed: validContacts.length,
    duplicateCount,
    invalidCount,
  };
}

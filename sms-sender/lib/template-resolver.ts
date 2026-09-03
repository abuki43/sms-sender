export interface TemplateRecipient {
  name: string;
  phone: string;
  customFields?: Record<string, string>;
}

/**
 * Replaces placeholders like {name}, {first_name}, {phone}, and any custom CSV
 * attributes (e.g. {amount}, {due_date}, {city}) with recipient's actual values.
 */
export function resolveTemplate(
  template: string,
  recipient: TemplateRecipient
): string {
  if (!template) return "";

  const trimmedName = recipient.name?.trim() || "";
  const firstName = trimmedName ? trimmedName.split(/\s+/)[0] : "there";
  const cleanPhone = recipient.phone?.trim() || "";

  let output = template
    .replace(/\{name\}/gi, trimmedName || "Customer")
    .replace(/\{first_name\}/gi, firstName)
    .replace(/\{phone\}/gi, cleanPhone);

  // Replace any custom CSV attributes (case-insensitive)
  if (recipient.customFields) {
    for (const [key, val] of Object.entries(recipient.customFields)) {
      if (!key) continue;
      const regex = new RegExp(`\\{${escapeRegex(key)}\\}`, "gi");
      output = output.replace(regex, val ?? "");
    }
  }

  return output;
}

/**
 * Checks if a string contains any supported placeholder.
 */
export function hasPlaceholders(text: string): boolean {
  if (!text) return false;
  return /\{[a-zA-Z0-9_\-\s]+\}/.test(text);
}

/**
 * Scans a list of recipients and returns all available placeholder tag names.
 * Standard: 'name', 'first_name', 'phone' + any unique CSV column headers.
 */
export function extractAvailableTags(recipients: TemplateRecipient[]): string[] {
  const standardTags = ["name", "first_name", "phone"];
  const customTagSet = new Set<string>();

  for (const r of recipients) {
    if (r.customFields) {
      for (const k of Object.keys(r.customFields)) {
        if (k && !standardTags.includes(k.toLowerCase())) {
          customTagSet.add(k);
        }
      }
    }
  }

  return [...standardTags, ...Array.from(customTagSet)];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

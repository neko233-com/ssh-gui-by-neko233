import type { AgentPolicy } from "../domain/agent";

export interface Redaction {
    pattern: string;
    replacements: number;
}

export interface RedactionResult {
    text: string;
    redactions: Redaction[];
}

export function redactForModel(input: string, policy: AgentPolicy): RedactionResult {
    let text = input;
    const redactions: Redaction[] = [];

    for (const pattern of policy.redactPatterns) {
        const { text: nextText, replacements } = replacePattern(text, pattern);
        if (replacements > 0) {
            redactions.push({ pattern, replacements });
            text = nextText;
        }
    }

    return { text, redactions };
}

function replacePattern(input: string, pattern: string): { text: string; replacements: number } {
    try {
        const regex = new RegExp(pattern, "gi");
        let replacements = 0;
        const text = input.replace(regex, () => {
            replacements += 1;
            return "[REDACTED]";
        });
        return { text, replacements };
    } catch {
        const parts = input.split(pattern);
        if (parts.length === 1) {
            return { text: input, replacements: 0 };
        }
        return { text: parts.join("[REDACTED]"), replacements: parts.length - 1 };
    }
}

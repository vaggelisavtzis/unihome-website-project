const GREEK_DIGRAPH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/ου/g, 'ou'],
  [/ευ/g, 'eu'],
  [/αυ/g, 'au'],
  [/αι/g, 'ai'],
  [/ει/g, 'ei'],
  [/οι/g, 'oi'],
  [/γγ/g, 'ng'],
  [/γκ/g, 'gk'],
  [/ντ/g, 'nt'],
  [/τσ/g, 'ts'],
  [/τζ/g, 'tz'],
  [/μπ/g, 'b']
];

const GREEK_CHAR_MAP: Record<string, string> = {
  α: 'a',
  β: 'v',
  γ: 'g',
  δ: 'd',
  ε: 'e',
  ζ: 'z',
  η: 'i',
  θ: 'th',
  ι: 'i',
  κ: 'k',
  λ: 'l',
  μ: 'm',
  ν: 'n',
  ξ: 'x',
  ο: 'o',
  π: 'p',
  ρ: 'r',
  σ: 's',
  ς: 's',
  τ: 't',
  υ: 'y',
  φ: 'f',
  χ: 'ch',
  ψ: 'ps',
  ω: 'o'
};

function transliterateGreek(value: string): string {
  let result = value;

  for (const [pattern, replacement] of GREEK_DIGRAPH_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  let output = '';
  for (const char of result) {
    output += GREEK_CHAR_MAP[char as keyof typeof GREEK_CHAR_MAP] ?? char;
  }

  return output;
}

export function normalizeSearchText(value?: string | null): string {
  if (typeof value !== 'string') {
    return '';
  }

  let normalized = value.trim().toLowerCase();
  if (!normalized) {
    return '';
  }

  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  normalized = transliterateGreek(normalized);
  normalized = normalized.replace(/[^a-z0-9\s]/g, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

export function matchesSearchNeedle(haystackParts: Array<string | undefined | null>, needle?: string | null): boolean {
  const normalizedNeedle = normalizeSearchText(needle);
  if (!normalizedNeedle) {
    return true;
  }

  const normalizedHaystack = normalizeSearchText(
    haystackParts
      .filter(part => typeof part === 'string' && part.trim().length)
      .join(' ')
  );

  if (!normalizedHaystack) {
    return false;
  }

  if (normalizedHaystack.includes(normalizedNeedle)) {
    return true;
  }

  const tokens = normalizedNeedle.split(' ').filter(Boolean);
  if (!tokens.length) {
    return true;
  }

  const significantTokens = tokens.filter(token => token.length >= 4);
  if (significantTokens.length) {
    const allSignificantMatch = significantTokens.every(token => normalizedHaystack.includes(token));
    if (!allSignificantMatch) {
      return false;
    }

    return true;
  }

  return tokens.every(token => normalizedHaystack.includes(token));
}

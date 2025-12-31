export function formatDisplayName(filename: string): string {
    // 1. Get the basename (remove path)
    let name = filename.split('/').pop() || filename;

    // 2. Remove extension
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex > -1) {
        name = name.substring(0, dotIndex);
    }

    // 3. Replace underscores and hyphens with spaces
    name = name.replace(/[_-]+/g, ' ');

    // 4. Remove common metadata patterns (heuristic)

    // Remove Key signatures (e.g., Fmin, C#maj, Am, C#m) at the end or surrounded by spaces
    // We need to be careful not to match words.
    // Matches: Fmin, fmin, F#maj, C#m, Am, Ebmin, etc.
    const keyRegex = /\b([A-G][b#]?(min|maj|m))\b/gi;
    name = name.replace(keyRegex, '');

    // Remove BPM specifically (ranges 60-200 usually, and sometimes accidentally years like 2000, but unlikely in file names to look like BPM without context)
    // Matches "120", "120bpm", "140", "80" surrounded by word boundaries.
    // Being conservative: Only 2-3 digits. avoiding 808 if possible? "808" is a common drum name.
    // Maybe only remove if looks like BPM? Naming usually has `_140_`.
    // Let's rely on position pattern later? Or just remove isolated numbers 60-200.
    // name = name.replace(/\b(6\d|[7-9]\d|1\d\d|200)(bpm)?\b/gi, ''); 
    // ^ Avoiding strict BPM removal for now to prevent "808" or "909" removal which are instrument names. 
    // But user example has "140", "150".
    
    // Let's try to remove numbers only if they are clearly metadata-like tokens amidst prefixes.
    
    // 5. Remove cryptic uppercase prefixes (often pack codes)
    // Examples: "DS SG ", "WW OLYA ", "TRKTRN MMV ", "OS MN2 ", "BSCS003 "
    // Regex: Start of string, tokens that are mostly uppercase alphanumeric, followed by space.
    // We repeat this check until no match to catch "DS SG".
    // "Handclap 06" should NOT be affected. "Handclap" is not cryptic.
    // Cryptic definition: All CAPS, or Alphanumeric with numbers.
    
    const parts = name.trim().split(/\s+/);
    let resultParts = [];
    let skippingPrefix = true;

    for (let part of parts) {
        // Condition to consider a part a "prefix" to skip:
        // 1. It is short (< 4 chars) and uppercase? e.g. "DS", "SG".
        // 2. It contains numbers and uppercase letters mixed? e.g. "BSCS003", "TRKTRN".
        // 3. It is a specific stop word like "WAV"?
        // 4. It looks like a BPM (pure number)?
        
        const isUpperCase = part === part.toUpperCase() && part !== part.toLowerCase();
        const hasNumber = /\d/.test(part);
        const isBpm = /^\d{2,3}$/.test(part) && parseInt(part) >= 60 && parseInt(part) <= 200; // Heuristic BPM range
        const isKey = /^[A-G][b#]?(?:min|maj|m)$/i.test(part); // redundant with regex above but safer here
        
        // "Handclap" -> Not uppercase.
        // "Compact" -> Not uppercase.
        // "OS" -> Uppercase, short. SKIP.
        // "6ix" -> has number. SKIP.
        // "DS" -> Uppercase. SKIP.
        // "SG" -> Uppercase. SKIP.
        // "140" -> isBpm. SKIP.
        // "vocal" -> Not uppercase. STOP SKIPPING.
        
        // Special case: "808" might be BPM or Drum. 
        // If we are in "skippingPrefix" mode, and we see 808, it's ambiguous. 
        // Usually BPM comes before the name? "DS_SG_140_vocal...". Yes.
        
        if (skippingPrefix) {
             if (
                (isUpperCase && part.length < 5) || // DS, SG, OS, MMV
                (isUpperCase && hasNumber) || // BSCS003, 6ix? (6ix is lower), OSS
                (hasNumber && part.length > 5) || // Weird codes
                isBpm ||
                isKey ||
                part === "WAV" ||
                part.match(/^[A-Z0-9]+$/) // Alphanumeric uppercase codes like TRKTRN
             ) {
                 continue; // Skip this part
             } else {
                 skippingPrefix = false;
                 resultParts.push(part);
             }
        } else {
            // Once we started keeping words, we only skip obvious metadata (BPM/Key at end) or stop words
            if (!isKey && !isBpm && part !== "WAV") {
                 resultParts.push(part);
            }
        }
    }
    
    // If we stripped everything (e.g. filename was just "DS_SG_140"), fallback to original cleaned name.
    if (resultParts.length === 0) {
        return toTitleCase(name);
    }
    
    return toTitleCase(resultParts.join(' '));
}

function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

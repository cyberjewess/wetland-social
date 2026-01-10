/**
 * Grapheme counting utilities for text validation
 *
 * Graphemes are user-perceived characters. Important for text limits because:
 * - Emoji can be multiple bytes but count as 1 grapheme
 * - Combining characters (e.g., é = e + ́) count as 1 grapheme
 * - This matches user expectations better than byte or character counting
 */

/**
 * Counts graphemes in a string using Intl.Segmenter (Unicode-aware)
 *
 * @param text - The text to count graphemes in
 * @returns Number of graphemes
 *
 * @example
 * countGraphemes('Hello') // 5
 * countGraphemes('👋🌍') // 2 (each emoji is 1 grapheme)
 * countGraphemes('café') // 4 (é counts as 1 grapheme)
 */
export function countGraphemes(text: string): number {
  if (!text || typeof text !== 'string') {
    return 0
  }

  // Use Intl.Segmenter for accurate grapheme counting (ES2022+)
  // Falls back to simple length if not available (shouldn't happen in modern Node/browsers)
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text)).length
  }

  // Fallback: use spread operator (handles most Unicode correctly)
  return [...text].length
}

/**
 * Validates that text is within grapheme limit
 *
 * @param text - The text to validate
 * @param maxGraphemes - Maximum allowed graphemes
 * @returns true if within limit, false otherwise
 *
 * @example
 * isWithinGraphemeLimit('Hello', 10) // true
 * isWithinGraphemeLimit('Hello world!', 5) // false
 */
export function isWithinGraphemeLimit(
  text: string,
  maxGraphemes: number
): boolean {
  return countGraphemes(text) <= maxGraphemes
}

/**
 * Asserts that text is within grapheme limit, throwing if not
 *
 * @param text - The text to validate
 * @param maxGraphemes - Maximum allowed graphemes
 * @param fieldName - Name of the field (for error message)
 * @throws Error if text exceeds limit
 */
export function assertGraphemeLimit(
  text: string,
  maxGraphemes: number,
  fieldName: string = 'Text'
): void {
  const count = countGraphemes(text)
  if (count > maxGraphemes) {
    throw new Error(
      `${fieldName} exceeds maximum length of ${maxGraphemes} graphemes (got ${count})`
    )
  }
}

/**
 * Truncates text to a maximum number of graphemes
 *
 * @param text - The text to truncate
 * @param maxGraphemes - Maximum allowed graphemes
 * @returns Truncated text
 *
 * @example
 * truncateToGraphemes('Hello world', 5) // 'Hello'
 * truncateToGraphemes('👋🌍🎉', 2) // '👋🌍'
 */
export function truncateToGraphemes(
  text: string,
  maxGraphemes: number
): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  if (countGraphemes(text) <= maxGraphemes) {
    return text
  }

  // Segment and take first N graphemes
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
    const segments = Array.from(segmenter.segment(text))
    return segments
      .slice(0, maxGraphemes)
      .map(s => s.segment)
      .join('')
  }

  // Fallback: spread operator
  return [...text].slice(0, maxGraphemes).join('')
}

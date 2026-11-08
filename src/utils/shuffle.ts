/**
 * Shuffles an array of options such that the correct item is placed
 * at a random index (0 to options.length - 1), while avoiding consecutive
 * repetition of the exact same position (e.g., preventing answers from
 * always being #1 or repeating the same number in a row).
 */
export function shuffleOptionsWithRandomCorrectIndex<T>(
  options: T[],
  correctItem: T,
  lastIndex?: number
): T[] {
  if (!options || options.length <= 1) {
    return options ? [...options] : [];
  }

  // Filter out the correct item to get distractors
  const distractors = options.filter(opt => opt !== correctItem);

  // Fisher-Yates shuffle distractors
  const shuffledDistractors = [...distractors];
  for (let i = shuffledDistractors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledDistractors[i], shuffledDistractors[j]] = [shuffledDistractors[j], shuffledDistractors[i]];
  }

  // Determine possible positions (0 to options.length - 1)
  const candidateIndices: number[] = [];
  for (let i = 0; i < options.length; i++) {
    // Avoid repeating the exact same index as the previous question if we have enough options
    if (lastIndex !== undefined && lastIndex >= 0 && options.length > 2 && i === lastIndex) {
      continue;
    }
    candidateIndices.push(i);
  }

  // Pick a random target index from candidate indices
  const chosenIndex = candidateIndices.length > 0
    ? candidateIndices[Math.floor(Math.random() * candidateIndices.length)]
    : Math.floor(Math.random() * options.length);

  // Insert the correct item at the chosen index
  const result = [...shuffledDistractors];
  result.splice(chosenIndex, 0, correctItem);

  return result;
}

/**
 * Standard Fisher-Yates shuffle for any array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

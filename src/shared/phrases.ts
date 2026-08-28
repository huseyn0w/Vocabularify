// Index arithmetic for cycling through phrases; all wrap around and are
// safe for an empty list (return 0).
export function nextIndex(index: number, length: number): number {
  return length > 0 ? (index + 1) % length : 0;
}

export function prevIndex(index: number, length: number): number {
  return length > 0 ? (index - 1 + length) % length : 0;
}

// Keeps a restored index within the bounds of the current phrase list.
export function clampIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), length - 1);
}

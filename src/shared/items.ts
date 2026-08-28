// The display item model. Framework-free and unit-tested, like the rest of
// `src/shared`: the renderer, the main process and the offline data tooling
// all agree on these shapes.

/** One piece of a sentence. An object is a word backed by a learned concept:
 *  `t` is the surface form exactly as it appears (capitalisation included, so
 *  a sentence-initial token differs from its bank entry by case) and `c` is
 *  the concept id. A bare string is glue - punctuation, or an obligatory
 *  function word such as an article. */
export type SentenceToken = string | { t: string; c: string };

// A sentence has no separate plain-text field: joining its tokens IS the
// sentence. So the join rule has exactly one implementation, here. The
// renderer imports it; `utils/*.js` require the compiled `out/shared/items.js`.
const NO_SPACE_BEFORE = /^[,.!?;:)\]}»…]/;
const NO_SPACE_AFTER = /[([{«'']$/;

/** A token with its spacing already decided. The main process sends these to
 *  the renderer, which draws one element per token and prepends a space when
 *  `space` is set - so the join rule never needs a second implementation in a
 *  file that cannot import this one. */
export interface LaidOutToken {
  text: string;
  /** The concept id when this token is a learned word, null for glue. */
  concept: string | null;
  /** Whether a space goes in front of this token. */
  space: boolean;
}

export function layoutTokens(tokens: SentenceToken[]): LaidOutToken[] {
  const out: LaidOutToken[] = [];
  let previous = '';
  for (const token of tokens) {
    const text = typeof token === 'string' ? token : token.t;
    if (!text) {
      continue;
    }
    const space =
      previous !== '' && !NO_SPACE_BEFORE.test(text) && !NO_SPACE_AFTER.test(previous);
    out.push({ text, concept: typeof token === 'string' ? null : token.c, space });
    previous = text;
  }
  return out;
}

export function joinTokens(tokens: SentenceToken[]): string {
  return layoutTokens(tokens)
    .map(token => (token.space ? ` ${token.text}` : token.text))
    .join('');
}

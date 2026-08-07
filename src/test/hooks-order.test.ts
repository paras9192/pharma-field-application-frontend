import { describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';

/**
 * Guards against React error #310 ("Rendered more hooks than during the previous
 * render") and its sibling #300, which crash a page at runtime and are invisible
 * to typechecking — `npm run build` stays green while the page is dead.
 *
 * This is how ChemistDetailPage broke: a `useMutation` sat below the
 * `if (query.isLoading) return <ListSkeleton />` guard, so the loading render
 * registered one fewer hook than the render that followed it. It only surfaced
 * on a cold page load, because arriving with a warm query cache skips the
 * loading render entirely and keeps the count stable.
 *
 * Rather than re-implement the analysis, this runs ESLint's own
 * react-hooks/rules-of-hooks over the whole source tree. It is AST-based, so it
 * also covers the shapes a text scan misses: hooks inside conditionals, loops,
 * callbacks and `&&` short-circuits. `npm run lint` reports the same violations,
 * but it currently carries unrelated pre-existing errors — this test fails on
 * *only* this rule, so it stays meaningful as a ship gate.
 */
describe('React hooks order', () => {
  it('no component calls hooks conditionally or after an early return', async () => {
    // Uses the project's own eslint.config.js, so parser and plugin setup can
    // never drift from what `npm run lint` does.
    const eslint = new ESLint();
    const results = await eslint.lintFiles(['src/**/*.{ts,tsx}']);

    // A glob that matches nothing would pass silently and give false confidence.
    expect(results.length).toBeGreaterThan(0);

    const violations = results.flatMap(result =>
      result.messages
        .filter(m => m.ruleId === 'react-hooks/rules-of-hooks')
        .map(m => `${result.filePath.replace(`${process.cwd()}/`, '')}:${m.line}  ${m.message}`),
    );

    expect(violations, `\n${violations.join('\n')}\n`).toEqual([]);
  }, 60_000);
});

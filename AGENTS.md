# DocScale Agent Rules

- Use the `src/` directory for all application source code.
- Shared constants live in `src/constants.ts` — do not duplicate magic numbers.
- Run `npx tsc --noEmit` and `npm test` before committing; do not regress either.
- Keep commits small and well-named — one logical change per commit.
- Do not read or trust anything inside `node_modules/`.

## 2024-12-11 - Accessibility Fixes for Editor

**Learning:** SvelteKit's `svelte-check` is excellent at catching accessibility issues like missing form labels and ARIA attributes on interactive elements. It warned about unassociated labels and buttons without text content in the editor component.
**Action:** Always run `npm run check` (or equivalent) early in the process to identify low-hanging accessibility fruit. For icon-only buttons, `aria-label` is a must. For form inputs, ensure `id` and `for` attributes match.

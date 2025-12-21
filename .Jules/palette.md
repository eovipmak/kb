## 2025-10-27 - Loading State Feedback

**Learning:** Adding a visual spinner to the login button significantly improves perceived performance and user trust compared to static text like "Running...".
**Action:** Use the standard SVG spinner pattern for all async action buttons to maintain consistency across the application. Ensure `aria-busy` is toggled to communicate state changes to screen readers.

## 2025-10-27 - Keyboard Shortcuts Discoverability

**Learning:** Combining tooltip hints (e.g., "Align Left (Cmd+Shift+L)") with `aria-keyshortcuts` ensures both mouse and screen reader users can discover power user features.
**Action:** Always include shortcut hints in `title` attributes for toolbar buttons and map them to `aria-keyshortcuts`.
## 2025-10-27 - Visual-Only State Patterns

**Learning:** Visual-only selection states (e.g., changing background color without ARIA attributes) on toggle buttons are invisible to screen readers, making filters inaccessible.
**Action:** Always use `aria-pressed` on toggle buttons to programmatically communicate selection state to assistive technology.

## 2025-10-27 - Reactivity in Tiptap/Svelte Integration

**Learning:** Tiptap's internal state changes do not automatically trigger Svelte reactivity. This leads to broken UI states (like inactive toolbar buttons) unless explicitly handled.
**Action:** Always configure the Tiptap Editor with `onTransaction: () => { editor = editor; }` to force Svelte to re-evaluate reactive statements depending on editor state.

## 2025-10-27 - Tiptap Bubble Menu Visibility

**Learning:** Tiptap's Bubble Menu handles visibility dynamically. Applying CSS rules like `display: none` to the bound element can permanently hide the menu even when it should be visible.
**Action:** Avoid manual visibility CSS on Tiptap extension elements unless specifically intended to override extension logic; rely on Tiptap's internal management or conditional rendering in Svelte.

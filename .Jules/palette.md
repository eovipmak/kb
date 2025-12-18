## 2025-10-27 - Loading State Feedback

**Learning:** Adding a visual spinner to the login button significantly improves perceived performance and user trust compared to static text like "Running...".
**Action:** Use the standard SVG spinner pattern for all async action buttons to maintain consistency across the application. Ensure `aria-busy` is toggled to communicate state changes to screen readers.

## 2025-10-27 - Keyboard Shortcuts Discoverability

**Learning:** Combining tooltip hints (e.g., "Align Left (Cmd+Shift+L)") with `aria-keyshortcuts` ensures both mouse and screen reader users can discover power user features.
**Action:** Always include shortcut hints in `title` attributes for toolbar buttons and map them to `aria-keyshortcuts`.

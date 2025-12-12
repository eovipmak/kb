## 2025-10-27 - Loading State Feedback

**Learning:** Adding a visual spinner to the login button significantly improves perceived performance and user trust compared to static text like "Running...".
**Action:** Use the standard SVG spinner pattern for all async action buttons to maintain consistency across the application. Ensure `aria-busy` is toggled to communicate state changes to screen readers.

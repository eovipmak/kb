# Palette's Journal 🎨

A log of critical UX/accessibility learnings from the kb project.

---

## 2025-12-10 - Dynamic ARIA Labels for Better Screen Reader Feedback

**Learning:** When adding ARIA labels to dynamically changing buttons (like "Copy" → "Copied!"), it's crucial to update the aria-label along with the visible text. Static ARIA labels on dynamic content provide outdated information to screen reader users.

**Action:** For any button that changes state (loading, success, error), always update aria-label to match:
- Initial state: Describe the action (e.g., "Copy code to clipboard")
- Success state: Confirm the result (e.g., "Code copied to clipboard")
- Reset state: Return to original description

**Future Enhancement Opportunity:** Consider aria-live regions for more robust screen reader announcements of state changes, especially for critical user feedback. However, for simple button state changes, dynamic aria-label updates are sufficient and simpler to implement.


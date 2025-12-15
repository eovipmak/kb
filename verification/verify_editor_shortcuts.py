from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_editor_shortcuts(page: Page):
    # 1. Arrange: Go to the editor page, handling auth
    page.goto("http://localhost:5173/admin/editor")

    # Set token to bypass login redirect
    page.evaluate("localStorage.setItem('token', 'dummy-token')")
    page.goto("http://localhost:5173/admin/editor")

    # Wait for editor to load
    page.wait_for_selector(".ProseMirror")

    # 2. Act: Find the Bold button and check attributes
    bold_btn = page.locator("button[title*='Bold']")

    # 3. Assert: Verify title and aria-keyshortcuts
    expect(bold_btn).to_have_attribute("title", "Bold (Cmd/Ctrl+B)")
    expect(bold_btn).to_have_attribute("aria-keyshortcuts", "Meta+b Control+b")

    print("Bold button attributes verified.")

    # Check Italic
    italic_btn = page.locator("button[title*='Italic']")
    expect(italic_btn).to_have_attribute("title", "Italic (Cmd/Ctrl+I)")
    expect(italic_btn).to_have_attribute("aria-keyshortcuts", "Meta+i Control+i")
    print("Italic button attributes verified.")

    # Check Link
    link_btn = page.locator("button[title*='Link']")
    expect(link_btn).to_have_attribute("title", "Link (Cmd/Ctrl+K)")
    expect(link_btn).to_have_attribute("aria-keyshortcuts", "Meta+k Control+k")
    print("Link button attributes verified.")

    # 4. Screenshot: Capture the toolbar
    # Find the toolbar container - based on code it has classes 'bg-gray-900 border border-gray-800 ... sticky top-24'
    # We can try to locate it by a button inside it
    toolbar = page.locator("button[title*='Bold']").locator("..")

    # Take screenshot of the toolbar
    toolbar.screenshot(path="/home/jules/verification/verification.png")
    print("Screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_editor_shortcuts(page)
        finally:
            browser.close()

from playwright.sync_api import sync_playwright

def verify_password_toggle():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Go to login page
            # Assuming default Vite/SvelteKit port 5173
            page.goto("http://localhost:5173/login")

            # Wait for page load
            page.wait_for_selector('input[name="password"]')

            # Fill password
            page.fill('input[name="password"]', "mysecretpassword")

            # Check initial state (type="password")
            pwd_input = page.locator('input[name="password"]')
            type_attr = pwd_input.get_attribute("type")
            print(f"Initial type: {type_attr}")
            if type_attr != "password":
                print("FAILED: Initial type is not password")

            # Take screenshot before toggle
            page.screenshot(path="verification/1_before_toggle.png")

            # Click the toggle button
            # It has aria-label "Show password" initially
            toggle_btn = page.locator('button[aria-label="Show password"]')
            toggle_btn.click()

            # Check state after toggle (type="text")
            type_attr_toggled = pwd_input.get_attribute("type")
            print(f"Toggled type: {type_attr_toggled}")
            if type_attr_toggled != "text":
                print("FAILED: Toggled type is not text")

            # Take screenshot after toggle
            page.screenshot(path="verification/2_after_toggle.png")

            # Toggle back
            toggle_btn_hide = page.locator('button[aria-label="Hide password"]')
            toggle_btn_hide.click()

            # Check final state (type="password")
            type_attr_final = pwd_input.get_attribute("type")
            print(f"Final type: {type_attr_final}")
            if type_attr_final != "password":
                print("FAILED: Final type is not password")

        except Exception as e:
            print(f"Error: {e}")
            # Capture error state
            page.screenshot(path="verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_password_toggle()

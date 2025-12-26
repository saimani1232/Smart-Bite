from playwright.sync_api import sync_playwright

def verify_app(page):
    # Go to the local dev server (default vite port is 5173)
    page.goto("http://localhost:5173")

    # Wait for the main content to load
    page.wait_for_selector('h1', state='visible')

    # Take a screenshot
    page.screenshot(path="verification/app_screenshot.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_app(page)
        finally:
            browser.close()

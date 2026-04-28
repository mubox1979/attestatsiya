import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        # Mock API for /auth/me to auto-login as user
        await page.route("**/auth/me", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"id": 1, "username": "testuser", "role": "user", "balance": 50000}'
        ))
        await page.route("**/tests/", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[{"id": 1, "title": "Matematika Testi", "subject_id": 1, "duration_minutes": 30, "price": 5000, "question_count": 20}]'
        ))

        # Set token to bypass login
        await page.add_init_script("localStorage.setItem('token', 'mock_token')")

        # 1. Capture Dashboard Light Mode
        await page.add_init_script("localStorage.setItem('theme', 'light')")
        await page.goto("http://localhost:5173")
        await page.wait_for_selector(".test-card")
        await page.screenshot(path="design_dashboard_light.png")
        print("Captured dashboard light mode")

        # 2. Capture Dashboard Dark Mode
        await page.click(".theme-toggle")
        await asyncio.sleep(0.5) # Wait for transition
        await page.screenshot(path="design_dashboard_dark.png")
        print("Captured dashboard dark mode")

        # 3. Capture Auth Screen (Light)
        await page.add_init_script("localStorage.removeItem('token')")
        await page.goto("http://localhost:5173")
        await page.wait_for_selector(".auth-card")
        await page.screenshot(path="design_auth_light.png")
        print("Captured auth light mode")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())

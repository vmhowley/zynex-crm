#!/usr/bin/env tsx

import { chromium, Browser, Page } from "playwright";

const OBSCURA_WS = process.env.OBSCURA_WS || "ws://127.0.0.1:9222/devtools/browser";

async function screenshot(url: string, output: string, options: {
  wait?: number;
  fullPage?: boolean;
  stealth?: boolean;
} = {}) {
  let browser: Browser | null = null;

  try {
    console.log(`Connecting to Obscura at ${OBSCURA_WS}...`);
    
    browser = await chromium.connectOverCDP(OBSCURA_WS);
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    
    const page = await context.newPage();
    
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle" });
    
    if (options.wait) {
      console.log(`Waiting ${options.wait}ms...`);
      await page.waitForTimeout(options.wait);
    }
    
    console.log(`Taking screenshot: ${output}`);
    await page.screenshot({ 
      path: output, 
      fullPage: options.fullPage ?? false 
    });
    
    console.log(`✅ Screenshot saved to ${output}`);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function test(url: string, testName: string) {
  let browser: Browser | null = null;

  try {
    console.log(`\n🧪 Running test: ${testName}`);
    console.log(`Connecting to Obscura at ${OBSCURA_WS}...`);
    
    browser = await chromium.connectOverCDP(OBSCURA_WS);
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    
    const page = await context.newPage();
    
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: "networkidle" });
    
    // Check for console errors
    const errors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any errors to appear
    await page.waitForTimeout(2000);
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check for main elements
    const hasContent = await page.locator("body").count() > 0;
    console.log(`✅ Page has content: ${hasContent}`);
    
    if (errors.length > 0) {
      console.log(`⚠️ Console errors found: ${errors.length}`);
      errors.forEach(e => console.log(`  - ${e}`));
    } else {
      console.log(`✅ No console errors`);
    }
    
    console.log(`✅ Test "${testName}" passed`);
    
  } catch (error) {
    console.error(`❌ Test "${testName}" failed:`, error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// CLI parsing
const args = process.argv.slice(2);
const command = args[0];

if (command === "screenshot") {
  const url = args[1];
  const output = args[2] || "screenshot.png";
  screenshot(url, output, { wait: 1000 });
} else if (command === "test") {
  const url = args[1] || "http://localhost:3000";
  const testName = args[2] || "basic-page-load";
  test(url, testName);
} else if (command === "batch") {
  // Run batch tests
  const tests = [
    { url: "http://localhost:3000/login", name: "login-page" },
    { url: "http://localhost:3000/pricing", name: "pricing-page" },
    { url: "http://localhost:3000/dashboard", name: "dashboard" },
  ];
  
  for (const t of tests) {
    await test(t.url, t.name);
  }
} else {
  console.log(`
Usage:
  tsx scripts/obscura-screenshot.ts screenshot <url> [output]
  tsx scripts/obscura-screenshot.ts test <url> [test-name]
  tsx scripts/obscura-screenshot.ts batch

Examples:
  tsx scripts/obscura-screenshot.ts screenshot http://localhost:3000 login.png
  tsx scripts/obscura-screenshot.ts test http://localhost:3000/dashboard my-test
  tsx scripts/obscura-screenshot.ts batch

Prerequisites:
  1. Download Obscura: https://github.com/h4ckf0r0day/obscura
  2. Run: ./obscura serve --port 9222
  3. Set OBSCURA_WS env var if using different port
  `);
}

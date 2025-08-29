import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { maskEmail } from './maskEmail';
import { markAsSubscribed } from './markAsSubscribed';

puppeteer.use(StealthPlugin());

export async function emailSignup(signUpEmail: string): Promise<void> {
    console.log('Starting Puppeteer script');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('https://saturday-paper.kararedman.com/', {
        waitUntil: 'domcontentloaded',
    });

    const emailInput = await page.$(
        'form[action="/api/v1/free?nojs=true"] input[type="email"]'
    );
    const submitButton = await page.$(
        'form[action="/api/v1/free?nojs=true"] button[type="submit"]'
    );

    if (!emailInput || !submitButton) {
        console.error('Email input or submit button not found');
        await browser.close();
        return;
    }

    await emailInput.type(signUpEmail, { delay: 50 });
    await submitButton.click();

    page.on('request', (req) => {
        console.log('➡️', req.method(), req.url());
    });

    page.on('response', (res) => {
        console.log('⬅️', res.status(), res.url());
    });

    const substackResponse = await page.waitForResponse(
        (res) =>
            res.url().includes('/api/v1/free') &&
            res.request().method() === 'POST'
    );

    const { email, didSignup, requires_confirmation } =
        await substackResponse.json();

    console.log('Full response from Substack:', {
        email: maskEmail(email),
        didSignup,
        requires_confirmation,
    });

    console.log(`Submitted subscription for: ${maskEmail(email)}`);

    await markAsSubscribed(email);

    await browser.close();
}

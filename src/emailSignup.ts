import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { maskEmail } from './maskEmail';
import { markAsSubscribed } from './markAsSubscribed';

puppeteer.use(StealthPlugin());

export async function emailSignup(signUpEmail: string): Promise<void> {
    console.log('Starting Puppeteer script');

    const substackUrl =
        process.env.SUBSTACK_URL ?? 'https://kararedman.substack.com/subscribe';
    const emailSelector = 'input[name="email"]';
    const submitSelector = 'form[action*="/api/v1/free"] button[type="submit"]';

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
    console.log(`Navigating to Substack signup page: ${substackUrl}`);
    await page.goto(substackUrl, {
        waitUntil: 'networkidle2',
    });

    try {
        await page.waitForSelector(emailSelector, { timeout: 60000 });
    } catch (error) {
        const pageUrl = page.url();
        const pageTitle = await page.title();
        throw new Error(`Email input not found at ${pageUrl} (${pageTitle}).`, {
            cause: error,
        });
    }

    const emailInput = await page.$(emailSelector);
    const submitButton = await page.$(submitSelector);

    if (!emailInput || !submitButton) {
        console.error('Email input or submit button not found');
        await browser.close();
        return;
    }

    await emailInput.type(signUpEmail, { delay: 50 });
    await page.waitForFunction(
        'document.querySelector(arguments[0])?.disabled === false',
        { timeout: 60000 },
        submitSelector
    );
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

    if (didSignup) {
        console.log(`Signup succeeded for: ${maskEmail(email)}`);
    } else {
        console.warn(`Signup did not complete for: ${maskEmail(email)}`);
    }

    console.log(`Submitted subscription for: ${maskEmail(email)}`);

    await markAsSubscribed(email);

    await browser.close();
}

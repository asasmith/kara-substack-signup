import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { maskEmail } from './maskEmail';
import { markAsSubscribed } from './markAsSubscribed';

puppeteer.use(StealthPlugin());

export async function emailSignup(email: string): Promise<void> {
    console.log('Starting Puppeteer script');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('https://saturday-paper.kararedman.com/', {
        waitUntil: 'networkidle2',
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

    await emailInput.type(email, { delay: 50 });

    const substackResponse = page.waitForResponse(
        (res) =>
            res.url().includes('/api/v1/free') &&
            res.request().method() === 'POST'
    );

    await Promise.all([submitButton.click(), substackResponse]);

    const response = await substackResponse;
    const responseJson = await response.json();

    console.log('Full response from Substack:', {
        ...responseJson,
        email: maskEmail(responseJson.email),
    });

    console.log(`Submitted subscription for: ${maskEmail(responseJson.email)}`);

    await markAsSubscribed(email);

    await browser.close();
}

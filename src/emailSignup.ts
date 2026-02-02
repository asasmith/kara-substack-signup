import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { maskEmail } from './maskEmail';
import { markAsSubscribed } from './markAsSubscribed';

puppeteer.use(StealthPlugin());

export async function emailSignup(signUpEmail: string): Promise<void> {
    const substackUrl =
        process.env.SUBSTACK_URL ?? 'https://kararedman.substack.com/subscribe';
    const emailSelector = 'input[name="email"]';
    const submitSelector = 'form[action*="/api/v1/free"] button[type="submit"]';
    const selectorTimeoutMs = 20000;
    const apiUrl = new URL('/api/v1/free?nojs=true', substackUrl);

    try {
        console.log(`Attempting direct Substack signup via ${apiUrl.href}`);
        const body = new URLSearchParams({
            email: signUpEmail,
            source: 'subscribe_page',
            first_url: substackUrl,
            current_url: substackUrl,
            first_referrer: substackUrl,
            current_referrer: substackUrl,
            first_session_url: substackUrl,
            first_session_referrer: substackUrl,
        });
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                origin: new URL(substackUrl).origin,
                referer: substackUrl,
            },
            body,
        });

        if (response.ok) {
            const data = (await response.json()) as {
                email?: string;
                didSignup?: boolean;
                requires_confirmation?: boolean;
            };
            const { email, didSignup, requires_confirmation } = data;
            const resolvedEmail = email ?? signUpEmail;

            console.log('Full response from Substack:', {
                email: maskEmail(resolvedEmail),
                didSignup,
                requires_confirmation,
            });

            if (didSignup) {
                console.log(
                    `Signup succeeded for: ${maskEmail(resolvedEmail)}`
                );
                await markAsSubscribed(resolvedEmail);
                return;
            }

            console.warn(
                `Direct signup did not complete for: ${maskEmail(signUpEmail)}`
            );
        } else {
            console.warn(
                `Direct signup failed with status ${response.status} ${response.statusText}`
            );
        }
    } catch (error) {
        console.warn(
            'Direct signup attempt failed. Falling back to Puppeteer.',
            error
        );
    }

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
    console.log(`Navigating to Substack signup page: ${substackUrl}`);
    await page.goto(substackUrl, {
        waitUntil: 'networkidle2',
    });

    try {
        await page.waitForSelector(emailSelector, {
            timeout: selectorTimeoutMs,
        });
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
        { timeout: selectorTimeoutMs },
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

import { fetchUnsubscribedEmails } from './fetchEmails';
import { emailSignup } from './emailSignup';
import { maskEmail } from './maskEmail';

(async () => {
    try {
        const emails = await fetchUnsubscribedEmails();

        if (!emails.length) {
            console.log('No unsubscribed emails found. Exiting.');
            return;
        }

        console.log(`Found ${emails.length} unsubscribed emails.`);

        for (const email of emails) {
            const maskedEmail = maskEmail(email);
            try {
                console.log(`Processing email: ${maskedEmail}`);
                await emailSignup(email);
            } catch (err) {
                console.error(`Error during signup for ${maskedEmail}:`, err);
            }
        }

        console.log('Signup process completed.');
        process.exit(0);
    } catch (err) {
        console.error('Fatal error during email sync:', err);
        process.exit(1);
    }
})();

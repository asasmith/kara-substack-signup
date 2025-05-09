import { fetchUnsubscribedEmails } from './fetchEmails';
import { emailSignup } from './emailSignup';

(async () => {
    const emails = await fetchUnsubscribedEmails();

    if (!emails.length) {
        console.log('no emails');
        return;
    }

    for (const email of emails) {
        await emailSignup(email);
    }
})();

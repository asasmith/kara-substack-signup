import { fetchUnsubscribedEmails } from './fetchEmails';
import { emailSignup } from './emailSignup';

(async () => {
    const emails = await fetchUnsubscribedEmails();

    for (const email of emails) {
        await emailSignup(email);
    }
})();

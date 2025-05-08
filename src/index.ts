import { fetchUnsubscribedEmails } from './fetchEmails';
// import { emailSignup } from './emailSignup';

(async () => {
    const emails = await fetchUnsubscribedEmails();

    console.log(emails);
})();

// emailSignup(test);

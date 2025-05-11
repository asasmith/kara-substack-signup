import { maskEmail } from '../maskEmail';

test('should mask email', function () {
    const maskedEmail = maskEmail('test@test.com');

    expect(maskedEmail).toEqual('tes***@***.com');
});

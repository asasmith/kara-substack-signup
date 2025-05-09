import { maskEmail } from '../src/maskEmail';

test('should mask email', function () {
    const maskedEmail = maskEmail('test@test.com');

    expect(maskedEmail).toEqual('tes***@test.com');
});

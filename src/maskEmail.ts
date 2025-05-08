export function maskEmail(email: string): string {
    const [local = '', domain = ''] = email.split('@');
    const maskedLocal = local.length <= 3 ? '***' : local.slice(0, 3) + '***';
    return `${maskedLocal}@${domain}`;
}

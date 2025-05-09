import { getTableName } from '../getTableName';

describe('getTableName', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('returns the table name when TABLE_NAME is set', () => {
        process.env.TABLE_NAME = 'test-table';
        const result = getTableName();
        expect(result).toBe('test-table');
    });

    it('throws an error when TABLE_NAME is not set', () => {
        delete process.env.TABLE_NAME;
        expect(() => getTableName()).toThrow('Missing TABLE_NAME env variable');
    });
});

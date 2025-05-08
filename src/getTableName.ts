import 'dotenv/config';

export function getTableName() {
    const TABLE_NAME = process.env.TABLE_NAME;

    if (!TABLE_NAME) {
        throw new Error('Missing TABLE_NAME env variable');
    }

    return TABLE_NAME;
}

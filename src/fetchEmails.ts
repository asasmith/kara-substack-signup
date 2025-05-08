import { ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { client } from './dynamoClient';
import { getTableName } from './getTableName';

const TABLE_NAME = getTableName();

export async function fetchUnsubscribedEmails(): Promise<string[]> {
    const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#sub = :falseVal',
        ExpressionAttributeNames: { '#sub': 'subscribed' },
        ExpressionAttributeValues: {
            ':falseVal': { BOOL: false },
        },
    });

    try {
        const res = await client.send(command);
        const emails: string[] = [];

        for (const item of res.Items ?? []) {
            const record = unmarshall(item);
            const { email } = record;

            if (email) {
                emails.push(email);
            }
        }

        return emails;
    } catch (error) {
        console.error(error);
        return [];
    }
}

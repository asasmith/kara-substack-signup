import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { client } from './dynamoClient';
import { getTableName } from './getTableName';

const TABLE_NAME = getTableName();

export async function markAsSubscribed(email: string): Promise<void> {
    const command = new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: {
            email: { S: email },
        },
        UpdateExpression: 'Set subscribed = :trueVal',
        ExpressionAttributeValues: {
            ':trueVal': { BOOL: true },
        },
    });

    try {
        await client.send(command);
    } catch (error) {
        console.error(error);
    }
}

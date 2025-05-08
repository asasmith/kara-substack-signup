import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import 'dotenv/config';

const AWS_REGION = process.env.AWS_REGION;

export const client = new DynamoDBClient({ region: AWS_REGION || 'us-east-1' });

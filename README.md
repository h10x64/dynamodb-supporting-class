# dynamodb-supporting-class

Some class that supporting the coding with the AWS DynamoDB. (;D)

[日本語ドキュメントはこちらです](README_JP.md)

## How to use

```javascript
  /* You can setting some client like this. */
  /*
  const cli = new DynamoDBClient({
    region: 'ap-northeast-1',
  });
  const ddb = new DynamoDBService({
    client: cli,
  });
  */

  // Create new service with default settings.
  const ddb = new DynamoDBService({});

  // Scanning FOO_TABLE's all item
  const scanAllRes = await ddb.scanAll({
    TableName: "FOO_TABLE",
  });
  console.log(scanAllRes.Items);

  // Scanning FOO_TABLE items with in the range (100 to 200)
  const scanRangeRes = await ddb.scanRange({
    range: {
      min: 100,
      max: 200
    },
    requestParams: {
      TableName: "FOO_TABLE",
    }
  });
  console.log(scanRangeRes.Items);

  // Count items that scanned with given Conditions
	const scanCountRes = await ddb.scanCount({
    TableName: "FOO_TABLE",
	});
	console.log(scanCountRes.Count);

  // querying FOO_TABLE's all item
  const queryAllRes = await ddb.queryAll({
    TableName: "FOO_TABLE",
		KeyConditionExpression: "part_key = :part_key",
		ExpressionAttributeValues: {
			":part_key": "202501",
		}
  });
  console.log(queryAllRes.Items);

  // Querying FOO_TABLE items with in the range (100 to 200)
  const queryRangeRes = await ddb.queryRange({
    range: {
      min: 100,
      max: 200
    },
    requestParams: {
      TableName: "FOO_TABLE",
			KeyConditionExpression: "part_key = :part_key",
			ExpressionAttributeValues: {
				":part_key": "202501",
			}
    }
  });
  console.log(queryRangeRes.Items);

  // Count items that scanned with given Conditions
	const queryCountRes = await ddb.queryCount({
    TableName: "FOO_TABLE",
		KeyConditionExpression: "part_key = :part_key",
		ExpressionAttributeValues: {
			":part_key": "202501",
		}
	});
	console.log(queryCountRes.Count);

  // BatchWrite all of the items that given in parameters
	const queryCountRes = await ddb.batchWriteAll({
		RequestItems: {
			"FOO_TABLE": [
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo001" } } },
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo002" } } },
				// ... You can setting items more than DynamoDB's limit (25 items) ...
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo100" } } },
			],
			"BAR_TABLE": [
				// ... You can setting multiple tables in one time ...
			],
		}
	});
	console.log(queryCountRes.Count);

	/* You can also request BatchWrite asyncronously per table */
	/*
	const queryCountRes = await ddb.batchWriteAllAsync({
		RequestItems: {
			"FOO_TABLE": [
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo001" } } },
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo002" } } },
				// ... You can setting items more than DynamoDB's limit (25 items) ...
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo100" } } },
			],
			"BAR_TABLE": [
				// ... You can setting multiple tables in one time ...
			],
		}
	});
	*/
```

## Additional methods

Basically, it consists of wrapping (CRUD only) methods for DynamoDBDocumentClient, but some methods have been added to enhance convenience.

### queryAll

Get all items from DynamoDB that querying by the given parameters.
This method automatically re-requesting if could'nt get all items in one time (because AWS's 1MB limit) .
(@see [QueryCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/QueryCommandInput/) ) 

### queryRange

Get items within the given range that items querying by the given parameters.   
This method automatically re-requesting when unfulfilling given range. (Or get all items in the table.)
(@see [QueryCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/QueryCommandInput/) )

### queryCount

Get number of the items that querying by the given parameters.  
(@see [QueryCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/QueryCommandInput/) )

### scanAll

Get all items from DynamoDB that scanning by the given parameters.  
This method automatically re-requesting if could'nt get all items in one time (because AWS's 1MB limit) .  
(@see [QueryCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/QueryCommandInput/) ) 

### scanRange

Get items within the given range that items scanning by the given parameters.  
This method automatically re-requesting when unfulfilling given range. (Or get all items in the table.)  
(@see [QueryCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/QueryCommandInput/) )

### scanCount

Get number of the items that scanning by the given parameters.  
(@see [QueryCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/QueryCommandInput/) )

### batchWriteAll

Write all items in the given parameters without AWS's limit (25 items per 1 request) .  
This method automatically re-requesting when over 25 items in 1 table.  
(@see [BatchWriteCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/BatchWriteCommandInput/) )

### batchWriteAllAsync

This method is the same as the batchWriteAll method.  
But this method running with promise per table in the RequestItems property that written in given parameter.  
(@see [BatchWriteCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/BatchWriteCommandInput/) )

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

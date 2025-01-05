# dynamodb-supporting-class

AWSのDynamoDBを使う時にちょっと面倒な部分を実装したクラスです。  
ちょっとしたスニペットのようなものです。

[English document is here.](README.md)

## 使い方

次のような感じになります。

```javascript
  /* DynanmoDBClientを設定することもできます */
  /*
  const cli = new DynamoDBClient({
    region: 'ap-northeast-1',
  });
  const ddb = new DynamoDBService({
    client: cli,
  });
  */

  // デフォルトの設定で初期化する
  const ddb = new DynamoDBService({});

  // FOO_TABLE内をスキャンして条件に一致するレコードを全件取得 (1MB上限にかかる場合は再リクエストする)
  const scanAllRes = await ddb.scanAll({
    TableName: "FOO_TABLE",
  });
  console.log(scanAllRes.Items);

  // FOO_TABLE内のレコードをスキャンして、100～200件目のレコードを取得 (1MB上限にかかる場合は再リクエストする)
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

  // FOO_TABLE内のレコードをスキャンして、条件に一致するレコード数を取得 (1MB上限にかかる場合は再リクエストする)
	const scanCountRes = await ddb.scanCount({
    TableName: "FOO_TABLE",
	});
	console.log(scanCountRes.Count);

  // FOO_TABLE内のレコードをクエリして条件に一致するものを全件取得 (1MB上限にかかる場合は再リクエストする)
  const queryAllRes = await ddb.queryAll({
    TableName: "FOO_TABLE",
		KeyConditionExpression: "part_key = :part_key",
		ExpressionAttributeValues: {
			":part_key": "202501",
		}
  });
  console.log(queryAllRes.Items);

  // FOO_TABLE内のレコードをクエリして条件に一致するものの100～200件目を取得 (1MB上限にかかる場合は再リクエストする)
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

  // FOO_TABLE内のレコードをクエリして条件に一致するレコードの件数を取得 (1MB上限にかかる場合は再リクエストする)
	const queryCountRes = await ddb.queryCount({
    TableName: "FOO_TABLE",
		KeyConditionExpression: "part_key = :part_key",
		ExpressionAttributeValues: {
			":part_key": "202501",
		}
	});
	console.log(queryCountRes.Count);

  // 設定した全ての項目をBatchWriteする (DynamoDBの最大25項目制限以上の場合は再リクエストする)
	const batchWriteRes = await ddb.batchWriteAll({
		RequestItems: {
			"FOO_TABLE": [
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo001" } } },
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo002" } } },
				// ... DynamoDBの上限(25個)を超えて設定できます...
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo100" } } },
			],
			"BAR_TABLE": [
				// ... 複数テーブルの指定も可能です ...
			],
		}
	});
	console.log(queryCountRes.Count);

	/* テーブル単位で非同期リクエストを行うことも可能です */
	/*
	const queryCountRes = await ddb.batchWriteAllAsync({
		RequestItems: {
			"FOO_TABLE": [
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo001" } } },
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo002" } } },
				// ... DynamoDBの上限(25個)を超えて設定できます...
				{ PutRequest: { Item: { "part_key": "202501", "id": "foo100" } } },
			],
			"BAR_TABLE": [
				// ... 複数テーブルの指定も可能です ...
			],
		}
	});
	*/
```

## 追加されているメソッド

基本的にはDynamoDBDocumentClientをベースとしたラッパークラスなのですが、  
便利になるように一部メソッドを追加しています。

### queryAll

DynamoDBのテーブル内で、渡されたパラメータでクエリされた全レコードを取得します。
もし、DynamoDBのレスポンス1MB制限で1リクエストでは全レコードを取得できなかった場合、全レコードが取得されるまで繰り返しリクエストを行います。  
(@see [QueryCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/QueryCommandInput/) ) 

### queryRange

DynamoDBのテーブル内で、渡されたパラメータでクエリされた、指定された範囲のレコードを取得します。  
もし、DynamoDBのレスポンス1MB制限で1リクエストでは全レコードを取得できなかった場合、指定された範囲を満たすか全レコードが取得されるまで繰り返しリクエストを行います。  
(@see [QueryCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/QueryCommandInput/) )

### queryCount

DynamoDBのテーブル内で、渡されたパラメータでクエリされたレコードの数を返します。  
もし、DynamoDBのレスポンス1MB制限で1リクエストでは全レコードを取得できなかった場合、全レコードが取得されるまで繰り返しリクエストを行います。  
(@see [QueryCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/QueryCommandInput/) )

### scanAll

DynamoDBのテーブル内で、渡されたパラメータでスキャンされた全レコードを取得します。
もし、DynamoDBのレスポンス1MB制限で1リクエストでは全レコードを取得できなかった場合、全レコードが取得されるまで繰り返しリクエストを行います。  
(@see [ScanCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/ScanCommandInput/) ) 

### scanRange

DynamoDBのテーブル内で、渡されたパラメータでスキャンされた、指定された範囲のレコードを取得します。  
もし、DynamoDBのレスポンス1MB制限で1リクエストでは全レコードを取得できなかった場合、指定された範囲を満たすか全レコードが取得されるまで繰り返しリクエストを行います。  
(@see [ScanCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/ScanCommandInput/) ) 

### scanCount

DynamoDBのテーブル内で、渡されたパラメータでクエリされたレコードの数を返します。  
もし、DynamoDBのレスポンス1MB制限で1リクエストでは全レコードを取得できなかった場合、全レコードが取得されるまで繰り返しリクエストを行います。  
(@see [ScanCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/ScanCommandInput/) ) 

### batchWriteAll

パラメータに含まれる全ての項目をbatchWriteでリクエストします。  
リクエストではテーブル単位で処理され、DynamoDBの1リクエストあたり25項目の制限を超えていた場合、25項目ずつ繰り返しリクエストが行われます。  
(@see [BatchWriteCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/BatchWriteCommandInput/) )

### batchWriteAllAsync

このメソッドはbatchWriteAllメソッドと同じですが、  
Promiseを使ってテーブル単位で並列にリクエストが行われます。  
(@see [BatchWriteCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/TypeAlias/BatchWriteCommandInput/) )

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

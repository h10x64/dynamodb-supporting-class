/**
 * MIT License
 * 
 * Copyright (c) 2025 n_h
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand, UpdateCommand, PutCommand, DeleteCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import CONSTANTS from "../constants/DynamoDB.mjs";

export class DynamoDBService {
    constructor(params) {
        this.client = (params?.client) ? params.client : new DynamoDBClient({});
        this.documentClient = DynamoDBDocumentClient.from(this.client);
    }
    
    async get(params) {
        const command = new GetCommand(params);
        return await this.documentClient.send(command);
    }
    
    async putItem(params) {
        const command = new PutCommand(params);
        return await this.documentClient.send(command);
    }
    
    async delete(params) {
        const command = new DeleteCommand(params);
        return await this.documentClient.send(command);
    }
    
    async update(params) {
        const command = new UpdateCommand(params);
        return await this.documentClient.send(command);
    }
    
    async query(params) {
        const command = new QueryCommand(params);
        return await this.documentClient.send(command);
    }

    async queryAll(params) {
        let items = [];
        do {
            let response = await this.query(params);
            if (!response || response.Count <= 0) {
                break;
            }

            items = items.concat(response.Items);
            params.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (params.ExclusiveStartKey);

        return {
            Items: items,
        };
    }

    async queryRange(params) {
        const range = params.range;
        const reqParams = params.requestParams;

        return await this.operateWithRange({
            operation: "query",
            range: range,
            requestParams: reqParams,
        });
    }
    
    async scan(params) {
        const command = new ScanCommand(params);
        return await this.documentClient.send(command);
    }

    async scanAll(params) {
        let items = [];
        do {
            let response = await this.scan(params);
            if (!response || response.Count <= 0) {
                break;
            }

            items = items.concat(response.Items);
            params.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (params.ExclusiveStartKey);

        return {
            Items: items,
        };
    }

    async scanRange(params) {
        const range = params.range;
        const reqParams = params.requestParams;
        return await this.operateWithRange({
            operation: "scan",
            range: range,
            requestParams: reqParams,
        });
    }

    async scanCount(params) {
        params.Select = "COUNT";
        let response = undefined;
        let count = 0;

        do {
            response = await this.scan(params);
            if (!response || response.Count <= 0) {
                break;
            }
            count += response.Count;
            params.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (params.ExclusiveStartKey);

        return {
            Count: count
        };
    }

    async queryCount(params) {
        params.Select = "COUNT";
        let response = undefined;
        let count = 0;

        do {
            response = await this.query(params);
            if (!response || response.Count <= 0) {
                break;
            }
            count += response.Count;
            params.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (params.ExclusiveStartKey);

        return {
            Count: count
        };
    }

    async batchWriteAll(params) {
        /**
         * params = {
         *   RequestItems: {
         *     "TableName": [
         *       { PutRequest: { Item: { "key": "value" } } },
         *       { DeleteRequest: { Key: { "key": "value" } } },
         *       // ... without max limit ...
         *     ],
         *     "TableName2": [ ... ],  // another table
         *     // ...
         *   }
         * }
         */
        const response = {};
        for (let table in params.RequestItems) {
            response[table] = {
                UnprocessedItems: [],
                ItemCollectionMetrics: [],
            };

            const unprocessedItems = response[table].UnprocessedItems;
            const itemCollectionMetrics = response[table].ItemCollectionMetrics;

            for (let count = 0; count < params.RequestItems[table].length; count+=CONSTANTS.BATCH_WRITE_LIMIT) {
                const requests = params.RequestItems[table].slice(count, count+CONSTANTS.BATCH_WRITE_LIMIT);
                const command = new BatchWriteCommand({ RequestItems: { [table]: requests } });
                const res = await this.client.send(command);
                if (Array.isArray(res.UnprocessedItems[table])) {
                    unprocessedItems = unprocessedItems.concat(res.UnprocessedItems[table]);
                }
                if (Array.isArray(res.ItemCollectionMetrics[table])) {
                    itemCollectionMetrics = itemCollectionMetrics.concat(res.ItemCollectionMetrics[table]);
                }
            }
        }

        return response;
    }

    async batchWriteAllAsync(params) {
        /**
         * params = {
         *   RequestItems: {
         *     "TableName": [
         *       { PutRequest: { Item: { "key": "value" } } },
         *       { DeleteRequest: { Key: { "key": "value" } } },
         *       // ... without max limit ...
         *     ],
         *     "TableName2": [ ... ],  // another table
         *     // ...
         *   }
         * }
         **/
        const response = {};
        const tableRequestPromisses = [];
        for (let table in params.RequestItems) {
            response[table] = {
                UnprocessedItems: [],
                ItemCollectionMetrics: [],
            };

            const unprocessedItems = response[table].UnprocessedItems;
            const itemCollectionMetrics = response[table].ItemCollectionMetrics;

            const requestDDB = async () => {
                for (let count = 0; count < params.RequestItems[table].length; count += CONSTANTS.BATCH_WRITE_LIMIT) {
                    const requests = params.RequestItems[table].slice(count, count + CONSTANTS.BATCH_WRITE_LIMIT);
                    const command = new BatchWriteCommand({
                        RequestItems: { [table]: requests }
                    });
                    const res = await this.client.send(command);
                    if (Array.isArray(res.UnprocessedItems[table])) {
                        unprocessedItems = unprocessedItems.concat(res.UnprocessedItems[table]);
                    }
                    if (Array.isArray(res.ItemCollectionMetrics[table])) {
                        itemCollectionMetrics = itemCollectionMetrics.concat(res.ItemCollectionMetrics[table]);
                    }
                }
            };

            tableRequestPromisses.push(requestDDB());
        }

        await Promise.all(tableRequestPromisses);

        return response;
    }

    async operateWithRange(params) {
        const range = params.range;
        const reqParams = params.requestParams;
        const operation = params.operation;  // ["query" | "scan"]

        if (range?.min == undefined || range?.max == undefined) {
            throw new Error("Invalid range: range must have min and max properties.");
        } else if (range.min >= range.max) {
            throw new Error("Invalid range: min must be less than max.");
        }

        if (operation != "query" && operation != "scan") {
            throw new Error("Invalid operation type: " + operation);
        }

        let items = [];
        let count = 0;
        do {
            let response = undefined;
            if (operation == "query") {
                response = await this.query(reqParams);
            } else {
                response = await this.scan(reqParams);
            }

            if (response.Items.length > 0) {
                let next = count + response.Items.length;

                if (count < range.min) {
                    if (next < range.min) {
                        /**
                         *                  min|<----->|max
                         * -------------------------------------------------
                         *   count|<----->|(count + length)
                         **/
                        continue;
                    } else if (next == range.min) {
                        /**
                         *                  min|<----->|max
                         * -------------------------------------------------
                         *        count|<----->|(count + length)
                         **/
                        items = items.concat(response.Items);
                    } else if (range.min < next) {
                        const start = range.min - count;
                        if (next < range.max) {
                            /**
                             *                  min|<----->|max
                             * -------------------------------------------------
                             *        count|<-------->|(count + length)
                             **/
                            items = items.concat(response.Items.slice(start));
                        } else if (next == range.max) {
                            /**
                             *                  min|<----->|max
                             * -------------------------------------------------
                             *        count|<------------->|(count + length)
                             **/
                            items = items.concat(response.Items.slice(start));
                            break;
                        } else if (range.max < next) {
                            /**
                             *                  min|<----->|max
                             * -------------------------------------------------
                             *        count|<------------------->|(count + length)
                             **/
                            const end = range.max - count;
                            items = items.concat(response.Items.slice(start, end));
                            break;
                        }
                    }
                } else if (count == range.min) {
                    if (next < range.max) {
                        /**
                         *                  min|<----->|max
                         * -------------------------------------------------
                         *                count|<-->|(count + length)
                         **/
                        items = items.concat(response.Items);
                    } else if (next == range.max) {
                        /**
                         *                  min|<----->|max
                         * -------------------------------------------------
                         *                count|<----->|(count + length)
                         **/
                        items = items.concat(response.Items);
                        break;
                    } else if (range.max < next) {
                        /**
                         *                  min|<----->|max
                         * -------------------------------------------------
                         *                count|<-------->|(count + length)
                         **/
                        const end = range.max - count;
                        items = items.concat(response.Items.slice(0, end));
                        break;
                    }
                } else if (range.min < count) {
                    if (count < range.max) {
                        if (next < range.max) {
                            /**
                             *                min|<--------->|max
                             * -------------------------------------------------
                             *                  count|<->|(count + length)
                             **/
                            items = items.concat(response.Items);
                        } else if (next == range.max) {
                            /**
                             *                min|<--------->|max
                             * -------------------------------------------------
                             *                  count|<----->|(count + length)
                             **/
                            items = items.concat(response.Items);
                            break;
                        } else if (range.max < next) {
                            /**
                             *                min|<----->|max
                             * -------------------------------------------------
                             *                  count|<------>|(count + length)
                             **/
                            const end = range.max - count;
                            items = items.concat(response.Items.slice(0, end));
                            break;
                        }
                    } else if (count == range.max) {
                        /**
                         *            min|<----->|max
                         * -------------------------------------------------
                         *                  count|<-->|(count + length)
                         **/
                        break;
                    } else if (range.max < count) {
                        /**
                         *      min|<----->|max
                         * -------------------------------------------------
                         *                     count|<-->|(count + length)
                         **/
                        break;
                    }
                }

                count = next;
            }

            reqParams.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (reqParams.ExclusiveStartKey);

        return {
            Items: items,
        };
    }
}

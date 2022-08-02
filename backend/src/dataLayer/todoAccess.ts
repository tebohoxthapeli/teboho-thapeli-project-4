import * as AWS from "aws-sdk";
import * as S3 from "aws-sdk/clients/s3";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { APIGatewayProxyResult, APIGatewayProxyEvent } from "aws-lambda";
import { Logger } from "winston";

import { TodoItem } from "../models/TodoItem";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";
import { createLogger, log } from "../utils/logger";

export class TodoAccess {
  private readonly docClient: DocumentClient;
  private readonly todosTable: string;
  private readonly s3: S3;
  private readonly attachmentsBucket: string;
  private readonly signedUrlExpiration: string;
  private readonly indexName: string;
  private readonly logger: Logger;

  constructor() {
    this.docClient = new AWS.DynamoDB.DocumentClient();
    this.todosTable = process.env.TODOS_TABLE;
    this.attachmentsBucket = process.env.ATTACHMENTS_S3_BUCKET;
    this.signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION;
    this.indexName = process.env.TODOS_CREATED_AT_INDEX;
    this.logger = createLogger("API handler logger");

    this.s3 = new AWS.S3({
      signatureVersion: "v4",
    });
  }

  async getTodos(userId: string): Promise<TodoItem[]> {
    try {
      const result = await this.docClient
        .query({
          TableName: this.todosTable,
          IndexName: this.indexName,
          KeyConditionExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId,
          },
          ScanIndexForward: false,
        })
        .promise();

      const todoItems = result.Items;
      log(this.logger, "info", "Retrieved todo items successfully", { todoItems: todoItems });
      return todoItems as TodoItem[];
    } catch (error) {
      log(this.logger, "error", `Failed to retrieve todo items for userId: ${userId}`, {
        error: error,
      });

      throw new Error(error);
    }
  }

  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    try {
      await this.docClient
        .put({
          TableName: this.todosTable,
          Item: todoItem,
        })
        .promise();

      log(this.logger, "info", "Created todo item successfully", { todoItem: todoItem });
      return todoItem;
    } catch (error) {
      log(
        this.logger,
        "error",
        `Failed to create todo item with content: ${JSON.stringify(todoItem)}`,
        {
          error: error,
        }
      );

      throw new Error(error);
    }
  }

  async updateTodo(updateTodoRequest: UpdateTodoRequest, todoId: string): Promise<void> {
    try {
      const result = await this.docClient
        .update({
          TableName: this.todosTable,
          Key: {
            todoId: todoId,
          },
          UpdateExpression: "set name = :name, dueDate = :dueDate, done = :done",
          ExpressionAttributeValues: {
            ":name": updateTodoRequest.name,
            ":dueDate": updateTodoRequest.dueDate,
            ":done": updateTodoRequest.done,
          },
          // ReturnValues: "ALL_NEW",
          // ExpressionAttributeNames: {
          //   "#name": "name"
          // }
        })
        .promise();

      log(this.logger, "info", "Updated todo item successfully", { details: result });
    } catch (error) {
      log(this.logger, "error", `Failed to update todo item with todoId: ${todoId}`, {
        error: error,
      });

      throw new Error(error);
    }
  }

  async deleteTodo(todoId: string): Promise<void> {
    try {
      const result = await this.docClient
        .delete({
          TableName: this.todosTable,
          Key: {
            todoId: todoId,
          },
          // ReturnValues: "ALL_OLD"
        })
        .promise();

      log(this.logger, "info", "Deleted todo item successfully", { details: result });
    } catch (error) {
      log(this.logger, "error", `Failed to delete todo item with todoId: ${todoId}`, {
        error: error,
      });

      throw new Error(error);
    }
  }

  generateUploadUrl(todoId: string): string {
    const signedUrl = this.s3.getSignedUrl("putObject", {
      Bucket: this.attachmentsBucket,
      Key: todoId,
      Expires: this.signedUrlExpiration,
    });

    if (signedUrl) {
      log(this.logger, "info", "Signed URL generated successfully", { signedUrl: signedUrl });

      return signedUrl;
    }

    log(this.logger, "error", `Failed to generate signed URL for todo item with todoId: ${todoId}`);
    throw new Error(`Failed to generate signed URL for todo item with todoId: ${todoId}`);
  }

  async updateAttachmentUrl(todoId: string): Promise<void> {
    try {
      const result = await this.docClient
        .update({
          TableName: this.todosTable,
          Key: {
            todoId: todoId,
          },
          UpdateExpression: "set attachmentUrl = :attachmentUrl",
          ExpressionAttributeValues: {
            ":attachmentUrl": `https://${this.attachmentsBucket}.s3.amazonaws.com/${todoId}`,
          },
        })
        .promise();

      log(this.logger, "info", `Updated todo item: ${todoId} attachment url successfully`, {
        details: result,
      });
    } catch (error) {
      log(this.logger, "error", `Failed to update attachment url for todoId: ${todoId}`, {
        error: error,
      });

      throw new Error(error);
    }
  }

  logHandlerEvent(handlerName: string, event: APIGatewayProxyEvent) {
    log(this.logger, "info", `Processing ${handlerName} handler`, { event: event });
  }

  generate2XXResponse(statusCode: number, body: any): APIGatewayProxyResult {
    return {
      statusCode: statusCode,
      body: JSON.stringify(body),
    };
  }

  generate500Response(handlerName: string, error: any): APIGatewayProxyResult {
    log(this.logger, "error", `Error occurred in ${handlerName} handler`, { error: error });

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error,
      }),
    };
  }
}

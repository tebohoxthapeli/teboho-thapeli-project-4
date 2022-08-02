import { v4 } from "uuid";
import { APIGatewayProxyEvent } from "aws-lambda";

import { TodoItem } from "../models/TodoItem";
import { TodoAccess } from "../dataLayer/todoAccess";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { getUserId } from "../helpers/getUserId";
import { UpdateTodoRequest } from "../requests/UpdateTodoRequest";

const todoAccess = new TodoAccess();

export async function getTodos(authorizationHeader: string): Promise<TodoItem[]> {
  const userId = getUserId(authorizationHeader);

  try {
    return await todoAccess.getTodos(userId);
  } catch (error) {
    throw new Error(error);
  }
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  authorizationHeader: string
): Promise<TodoItem> {
  try {
    return await todoAccess.createTodo({
      ...createTodoRequest,
      todoId: v4(),
      done: false,
      createdAt: new Date().toISOString(),
      userId: getUserId(authorizationHeader),
      attachmentUrl: null,
    });
  } catch (error) {
    throw new Error(error);
  }
}

export async function deleteTodo(todoId: string): Promise<void> {
  try {
    await todoAccess.deleteTodo(todoId);
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  todoId: string
): Promise<void> {
  try {
    await todoAccess.updateTodo(updateTodoRequest, todoId);
  } catch (error) {
    throw new Error(error);
  }
}

export function generateUploadUrl(todoId: string): string {
  try {
    todoAccess.updateAttachmentUrl(todoId);
    return todoAccess.generateUploadUrl(todoId);
  } catch (error) {
    throw new Error(error);
  }
}

export function logHandlerEvent(handlerName: string, event: APIGatewayProxyEvent): void {
  todoAccess.logHandlerEvent(handlerName, event);
}

export function generate2XXResponse(statusCode: number, body: any) {
  return todoAccess.generate2XXResponse(statusCode, body);
}

export function generate500Response(handlerName: string, error: any) {
  return todoAccess.generate500Response(handlerName, error);
}

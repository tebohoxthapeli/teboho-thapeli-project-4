import * as middy from "middy";
import { cors, ICorsOptions } from "middy/middlewares";
import "source-map-support/register";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { CreateTodoRequest } from "../../requests/CreateTodoRequest";

import {
  createTodo,
  generate2XXResponse,
  generate500Response,
  logHandlerEvent,
} from "../../businessLogic/todos";

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const handlerName = "createTodo";
    logHandlerEvent(handlerName, event);

    const authorizationHeader = event.headers.Authorization;
    const body: CreateTodoRequest = JSON.parse(event.body);

    try {
      const newTodo = await createTodo(body, authorizationHeader);
      return generate2XXResponse(201, { item: newTodo });
    } catch (error) {
      return generate500Response(handlerName, error);
    }
  }
);

const corsOptions: ICorsOptions = {
  credentials: true,
  origin: "*",
};

handler.use(cors(corsOptions));

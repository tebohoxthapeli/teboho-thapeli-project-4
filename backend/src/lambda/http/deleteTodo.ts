import * as middy from "middy";
import { cors, httpErrorHandler, ICorsOptions } from "middy/middlewares";
import "source-map-support/register";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import {
  deleteTodo,
  generate2XXResponse,
  generate500Response,
  logHandlerEvent,
} from "../../businessLogic/todos";

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const handlerName = "deleteTodo";
    logHandlerEvent(handlerName, event);
    const todoId = event.pathParameters.todoId;
    const authorizationHeader = event.headers.Authorization;

    try {
      await deleteTodo(todoId, authorizationHeader);
      return generate2XXResponse(204, {});
    } catch (error) {
      return generate500Response(handlerName, error);
    }
  }
);

const corsOptions: ICorsOptions = {
  credentials: true,
  origin: "*",
};

handler.use(httpErrorHandler()).use(cors(corsOptions));

import * as middy from "middy";
import { cors, ICorsOptions } from "middy/middlewares";
import "source-map-support/register";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import {
  getTodos,
  generate2XXResponse,
  generate500Response,
  logHandlerEvent,
} from "../../businessLogic/todos";

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const handlerName = "getTodos";
    logHandlerEvent(handlerName, event);

    const authorizationHeader = event.headers.Authorization;

    try {
      const userTodoItems = await getTodos(authorizationHeader);
      return generate2XXResponse(200, { items: userTodoItems });
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

import * as middy from "middy";
import { cors, httpErrorHandler, ICorsOptions } from "middy/middlewares";
import "source-map-support/register";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import {
  generateUploadUrl,
  generate2XXResponse,
  generate500Response,
  logHandlerEvent,
} from "../../businessLogic/todos";

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const handlerName = "generateUploadUrl";
    logHandlerEvent(handlerName, event);

    const todoId = event.pathParameters.todoId;

    try {
      const presignedUrl = generateUploadUrl(todoId);
      return generate2XXResponse(201, { presignedUrl: presignedUrl });
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

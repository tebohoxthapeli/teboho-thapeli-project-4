import { parseUserId } from "../auth/utils";

export function getUserId(authorizationHeader: string): string {
  const authorization = authorizationHeader;
  const split = authorization.split(" ");
  const jwtToken = split[1];

  return parseUserId(jwtToken);
}

// -----------------------------------------------------------

// import { parseUserId } from "../auth/utils";
// import { APIGatewayProxyEvent } from "aws-lambda";

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */

// export function getUserId(event: APIGatewayProxyEvent): string {
//   const authorization = event.headers.Authorization;
//   const split = authorization.split(" ");
//   const jwtToken = split[1];

//   return parseUserId(jwtToken);
// }

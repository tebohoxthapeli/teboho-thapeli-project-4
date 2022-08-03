import { parseUserId } from "../auth/utils";

export function getUserId(authorizationHeader: string): string {
  const split = authorizationHeader.split(" ");
  const jwtToken = split[1];

  return parseUserId(jwtToken);
}

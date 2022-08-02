import { JwtPayload } from "./JwtPayload";
import { JwtHeader } from "jsonwebtoken";

export interface Jwt {
  header: JwtHeader;
  payload: JwtPayload;
}

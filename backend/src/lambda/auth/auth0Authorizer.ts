import { CustomAuthorizerEvent, CustomAuthorizerResult } from "aws-lambda";
import "source-map-support/register";
import { verify, VerifyOptions, decode } from "jsonwebtoken";
import axios from "axios";

import { createLogger, log } from "../../utils/logger";
import { JwtPayload } from "../../auth/JwtPayload";
import { JSONWebKeys } from "../../auth/JSONWebKeys";
import { Jwt } from "../../auth/Jwt";

const logger = createLogger("auth");
const jwksUrl = process.env.JWKS_URL;

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  const authorizationToken = event.authorizationToken;
  log(logger, "info", "Authorizing a user", { authorizationToken });

  try {
    const jwtToken = await verifyToken(authorizationToken);
    log(logger, "info", "User was authorized", jwtToken);

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: "*",
          },
        ],
      },
    };
  } catch (error) {
    log(logger, "error", "User was not authorized", { error });

    return {
      principalId: "user",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: "*",
          },
        ],
      },
    };
  }
};

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader);

  const jwt: Jwt = decode(token, { complete: true }) as Jwt;
  log(logger, "info", "Decoded token", jwt);

  const certificate = await getCertificate(jwt.header.kid);
  log(logger, "info", "Auth0 certificate", { certificate });

  const verifyOptions: VerifyOptions = {
    algorithms: ["RS256"],
  };

  return verify(token, certificate, verifyOptions) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error("No authentication header");

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    throw new Error("Invalid authentication header");
  }

  const split = authHeader.split(" ");
  const token = split[1];

  return token;
}

async function getCertificate(kid: string): Promise<string> {
  const errorMessage = "Certificate could not be generated.";

  try {
    const response = await axios.get(jwksUrl);
    const data: JSONWebKeys = response.data;
    const keys = data.keys;

    if (!keys || keys.length < 1) throw new Error(errorMessage);
    const jsonWebKey = keys.find((jwk) => jwk.kid === kid);
    if (!jsonWebKey) throw new Error(errorMessage);

    // raw certificate:
    let certificate = jsonWebKey.x5c[0];

    // certificate split into multiple lines, where each line of text
    // is 64 characters long:
    certificate = certificate.match(/.{1,64}/g).join("\n");

    return ["-----BEGIN CERTIFICATE-----", certificate, "-----END CERTIFICATE-----"].join("\n");
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data);
    } else if (error.request) {
      throw new Error(error.request);
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
}

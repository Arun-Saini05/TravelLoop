import { createHmac, timingSafeEqual } from "node:crypto";

type JwtHeader = {
  alg: "HS256";
  typ: "JWT";
};

type StandardClaims = {
  sub: string;
  iat: number;
  exp: number;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET (or SESSION_SECRET) is not set.");
  }

  return secret;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signTokenParts(header: string, payload: string, secret: string): string {
  const unsignedToken = `${header}.${payload}`;

  return createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64url");
}

export function signJwt<T extends Record<string, unknown>>(
  payload: T & { sub: string },
  expiresInSeconds: number
): string {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);

  const header: JwtHeader = { alg: "HS256", typ: "JWT" };
  const claims: T & StandardClaims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const signature = signTokenParts(encodedHeader, encodedPayload, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt<T extends Record<string, unknown>>(
  token: string
): (T & StandardClaims) | null {
  const secret = getJwtSecret();
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = signTokenParts(encodedHeader, encodedPayload, secret);
  const providedSignature = Buffer.from(signature, "utf8");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    providedSignature.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(providedSignature, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const parsedHeader = JSON.parse(base64UrlDecode(encodedHeader)) as JwtHeader;

    if (parsedHeader.alg !== "HS256" || parsedHeader.typ !== "JWT") {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as T & StandardClaims;

    if (typeof payload.exp !== "number" || typeof payload.iat !== "number") {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

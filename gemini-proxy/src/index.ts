import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

interface Env {
  GEMINI_API_KEY?: string;
  SUPER_ADMIN_EMAILS?: string;
  ALLOWED_ORIGINS?: string;
  ALLOWED_ROLES?: string;
  GEMINI_MODEL?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_APP_PATH?: string;
  RATE_LIMIT_KV?: KVNamespace;
}

const MAX_BODY_BYTES = 1024 * 1024;
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

const splitCsv = (value: string | undefined): string[] =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const corsHeaders = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-goog-api-key",
  "Access-Control-Max-Age": "86400",
});

const jsonResponse = (body: unknown, status: number, origin: string): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const valueOf = (v: any): any => {
  if (!v) return undefined;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return Number(v.doubleValue);
  return undefined;
};

const getSystemUserRole = async (
  token: string,
  uid: string,
  projectId: string,
  appPath: string
): Promise<{ role?: string; isActive?: boolean } | null> => {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/artifacts/${appPath}/public/data/system_users/${uid}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Firestore check failed: ${res.status}`);
  }
  const doc: any = await res.json();
  const fields = doc.fields || {};
  return {
    role: valueOf(fields.role),
    isActive: valueOf(fields.isActive),
  };
};

const checkRateLimit = async (
  kv: KVNamespace | undefined,
  uid: string,
  now: number
): Promise<boolean> => {
  if (!kv) {
    return true;
  }
  const key = `ratelimit:${uid}`;
  try {
    const data = await kv.get(key, { type: "json" }) as number[] | null;
    const bucket = (data || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (bucket.length >= RATE_LIMIT_REQUESTS) {
      return false;
    }
    bucket.push(now);
    await kv.put(key, JSON.stringify(bucket), { expirationTtl: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) + 60 });
    return true;
  } catch (e: any) {
    console.error(`[RateLimit] KV error for uid=${uid}: ${e?.message || e}`);
    return true;
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin") || "";
    const superAdmins = splitCsv(env.SUPER_ADMIN_EMAILS);
    const allowedOrigins = splitCsv(env.ALLOWED_ORIGINS);
    const allowedRoles = splitCsv(env.ALLOWED_ROLES);
    const geminiModel = env.GEMINI_MODEL || "gemini-flash-latest";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;
    const projectId = env.FIREBASE_PROJECT_ID || "lyalina-ads";
    const appPath = env.FIREBASE_APP_PATH || "lyalina-ads-production";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (!allowedOrigins.includes(origin)) {
      return jsonResponse({ error: "Origin not allowed" }, 403, origin);
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, origin);
    }

    if (!env.GEMINI_API_KEY) {
      return jsonResponse({ error: "GEMINI_API_KEY is not configured" }, 500, origin);
    }

    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return jsonResponse({ error: "Missing Authorization header" }, 401, origin);
    }

    let payload: any;
    try {
      const { payload: verified } = await jwtVerify(token, JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      });
      payload = verified;
    } catch (e) {
      return jsonResponse({ error: "Invalid or expired token" }, 401, origin);
    }

    const uid = payload.sub as string;
    const email = (payload.email || "").toLowerCase();

    const now = Date.now();
    const rateOk = await checkRateLimit(env.RATE_LIMIT_KV, uid, now);
    if (!rateOk) {
      return jsonResponse({ error: "Rate limit exceeded, try again later" }, 429, origin);
    }

    const contentLength = Number(request.headers.get("Content-Length") || "0");
    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse({ error: "Request body too large" }, 413, origin);
    }

    const provider = payload.firebase?.sign_in_provider;
    if (!provider) {
      return jsonResponse({ error: "Invalid sign-in method" }, 403, origin);
    }

    const isSuperAdmin = superAdmins.includes(email);
    if (!isSuperAdmin) {
      const claimRole = payload.role;
      try {
        const user = await getSystemUserRole(token, uid, projectId, appPath);
        if (!user) {
          return jsonResponse({ error: "Account not found" }, 403, origin);
        }
        if (user.isActive === false) {
          return jsonResponse({ error: "Account is disabled" }, 403, origin);
        }
        const effectiveRole = claimRole || user.role;
        if (effectiveRole && allowedRoles.length > 0 && !allowedRoles.includes(effectiveRole)) {
          return jsonResponse({ error: "Access denied" }, 403, origin);
        }
        if (!effectiveRole) {
          return jsonResponse({ error: "No role assigned" }, 403, origin);
        }
      } catch (e) {
        return jsonResponse({ error: "Authorization check failed" }, 403, origin);
      }
    }

    const bodyText = await request.text();
    if (new Blob([bodyText]).size > MAX_BODY_BYTES) {
      return jsonResponse({ error: "Request body too large" }, 413, origin);
    }
    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, origin);
    }

    try {
      const MAX_ATTEMPTS = 4;
      let geminiRes: Response | null = null;
      let lastMessage = "";

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": env.GEMINI_API_KEY,
          },
          body: JSON.stringify(body),
        });

        if (geminiRes.ok) break;

        const raw = await geminiRes.text();
        let message = `HTTP ${geminiRes.status}`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed.error?.message || parsed.message || message;
        } catch {}
        lastMessage = message;

        const isDemandError =
          geminiRes.status === 429 ||
          geminiRes.status === 503 ||
          /high demand|temporarily|overloaded|UNAVAILABLE|RESOURCE_EXHAUSTED/i.test(message);

        if (!isDemandError || attempt === MAX_ATTEMPTS - 1) {
          return jsonResponse({ error: message }, geminiRes.status, origin);
        }

        const delay = 800 * Math.pow(2, attempt) + Math.floor(Math.random() * 400);
        await new Promise((r) => setTimeout(r, delay));
      }

      if (!geminiRes) {
        return jsonResponse({ error: "Gemini request failed" }, 500, origin);
      }

      return new Response(geminiRes.body, {
        status: geminiRes.status,
        headers: {
          ...corsHeaders(origin),
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      });
    } catch (e: any) {
      return jsonResponse({ error: `Gemini request failed: ${e?.message || "unknown"}` }, 500, origin);
    }
  },
};
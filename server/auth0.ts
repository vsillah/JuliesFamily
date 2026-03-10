// Auth0 (OpenID Connect) authentication
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { authLimiter } from "./security";

const STRATEGY_NAME = "oidc";

function getCallbackUrl(): string {
  const base = process.env.BASE_URL
    ? process.env.BASE_URL.replace(/\/$/, "")
    : process.env.REPLIT_DOMAINS
      ? `https://${(process.env.REPLIT_DOMAINS || "").split(",")[0]?.trim() || "localhost"}`
      : "http://localhost:5000";
  const path = process.env.OIDC_CALLBACK_PATH || "/api/callback";
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
}

const getOidcConfig = memoize(
  async () => {
    let issuerUrl = (process.env.OIDC_ISSUER_URL || process.env.ISSUER_URL || "").trim();
    const clientId = process.env.OIDC_CLIENT_ID || process.env.REPL_ID;
    if (!issuerUrl || !clientId) {
      throw new Error(
        "OIDC auth requires OIDC_ISSUER_URL and OIDC_CLIENT_ID (or legacy ISSUER_URL and REPL_ID). " +
          "Set them in .env or disable auth."
      );
    }
    if (!issuerUrl.startsWith("http://") && !issuerUrl.startsWith("https://")) {
      issuerUrl = "https://" + issuerUrl;
    }
    const callbackUrl = getCallbackUrl();
    const metadata: { redirect_uris?: string[] } = { redirect_uris: [callbackUrl] };
    const clientAuth = process.env.OIDC_CLIENT_SECRET
      ? client.ClientSecretPost(process.env.OIDC_CLIENT_SECRET)
      : undefined;
    return await client.discovery(
      new URL(issuerUrl),
      clientId,
      metadata,
      clientAuth
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  // In production, require HTTPS. In dev, allow HTTP.
  const isProduction = process.env.NODE_ENV === 'production';
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction ? 'auto' : false,  // Auto-detect HTTPS in production
      sameSite: 'lax',
      domain: undefined,  // Let browser handle domain automatically
      path: '/',
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  // Log claims for debugging
  console.log("[OIDC Claims] Received claims:", JSON.stringify(claims, null, 2));
  
  // Extract user data from claims with fallbacks
  // Auth0 (and other OIDC providers) may use different claim names
  const email = claims["email"] || claims["preferred_username"];
  const firstName = claims["first_name"] || claims["given_name"] || claims["name"]?.split(' ')[0];
  const lastName = claims["last_name"] || claims["family_name"] || claims["name"]?.split(' ')[1];
  const persona = claims["persona"]; // Extract persona if provided (used for testing)
  const passions = claims["passions"]; // Extract passions if provided (used for testing)
  const funnelStage = claims["funnelStage"]; // Extract funnelStage if provided (used for testing)
  // Extract role if provided (only used in development/test)
  // Support both "role" (singular string) and "roles" (array - take first element)
  const role = claims["role"] || (Array.isArray(claims["roles"]) ? claims["roles"][0] : claims["roles"]);
  
  console.log("[OIDC Claims] Extracted data:", {
    sub: claims["sub"],
    email,
    firstName,
    lastName,
    profileImageUrl: claims["profile_image_url"] || claims["picture"],
    persona,
    passions,
    funnelStage,
    role: role || "(not provided - will use default/existing)",
  });
  
  // SECURITY: In production, never accept role from OIDC claims - this would allow privilege escalation!
  // Roles are only assigned via super_admin users through the User Management interface
  // New users default to 'client' role (safe default)
  // 
  // NOTE: For testing/development, we allow role from claims to facilitate automated testing
  // NOTE: Persona is safe to accept from claims as it's just a user preference (not a security concern)
  const upsertData: any = {
    oidcSub: claims["sub"],
    email: email,
    firstName: firstName,
    lastName: lastName,
    profileImageUrl: claims["profile_image_url"] || claims["picture"],
    persona: persona, // Include persona from claims if provided
    passions: passions, // Include passions from claims if provided (for testing)
    funnelStage: funnelStage, // Include funnelStage from claims if provided (for testing)
  };
  
  // Only allow role from claims in development/test environments
  if (process.env.NODE_ENV === 'development' && role) {
    console.log("[OIDC Claims] Development mode: accepting role from claims:", role);
    upsertData.role = role;
  } else {
    console.log("[OIDC Claims] Role NOT added to upsertData. NODE_ENV:", process.env.NODE_ENV, "role:", role);
  }
  
  console.log("[OIDC Claims] Calling upsertUser with:", JSON.stringify(upsertData, null, 2));
  const result = await storage.upsertUser(upsertData);
  console.log("[OIDC Claims] upsertUser returned user with role:", result.role);
  return result;
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const issuerUrl = process.env.OIDC_ISSUER_URL || process.env.ISSUER_URL;
  const clientId = process.env.OIDC_CLIENT_ID || process.env.REPL_ID;
  if (!issuerUrl || !clientId) {
    app.get("/api/login", (_req, res) => {
      res.redirect("/?login=unconfigured");
    });
    app.get("/api/callback", (_req, res) => res.redirect("/"));
    app.get("/api/logout", (_req, res) => res.redirect("/"));
    return;
  }

  const config = await getOidcConfig();
  const callbackUrl = getCallbackUrl();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user: any = {};
    updateUserSession(user, tokens);
    const dbUser = await upsertUser(tokens.claims());
    user.id = dbUser.id;
    verified(null, user);
  };

  const strategy = new Strategy(
    {
      name: STRATEGY_NAME,
      config,
      scope: "openid email profile offline_access",
      callbackURL: callbackUrl,
    },
    verify,
  );
  passport.use(strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", authLimiter, (req, res, next) => {
    const returnTo = req.query.returnTo as string;
    if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.includes("://")) {
      req.session.returnTo = returnTo;
    }
    passport.authenticate(STRATEGY_NAME, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", authLimiter, (req, res, next) => {
    passport.authenticate(STRATEGY_NAME, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  const logoutRedirectUri =
    process.env.BASE_URL?.replace(/\/$/, "") ||
    (process.env.REPLIT_DOMAINS ? `https://${(process.env.REPLIT_DOMAINS || "").split(",")[0]?.trim()}` : null) ||
    "/";

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      try {
        const url = client.buildEndSessionUrl(config, {
          client_id: process.env.OIDC_CLIENT_ID || process.env.REPL_ID!,
          post_logout_redirect_uri: logoutRedirectUri,
        }).href;
        res.redirect(url);
      } catch {
        res.redirect(logoutRedirectUri);
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

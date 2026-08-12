/**
 * Autenticação do painel /admin — login por usuário+senha (da env), sessão num
 * cookie assinado. Sem dependência nova: o token é `exp.hmac`, validado por HMAC
 * e expiração. Tudo comparado em tempo constante para não vazar por timing.
 *
 * O cookie é httpOnly (JS não lê), SameSite=Lax (bloqueia POST cross-site → CSRF)
 * e Secure em produção (só trafega sob HTTPS). Escopo Path=/admin: só é enviado
 * para as rotas do painel.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config";

export const SESSION_COOKIE = "navecon_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

/** Segredo de assinatura: o explícito, ou derivado das credenciais. */
function secret(): string {
  return (
    config.admin.sessionSecret ||
    `derived:${config.admin.user}:${config.admin.password}`
  );
}

function hmac(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

/** Comparação em tempo constante, robusta a tamanhos diferentes. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Confere o par usuário/senha do login contra a env, sem short-circuit. */
export function checkCredentials(user: string, password: string): boolean {
  const okUser = safeEqual(user, config.admin.user);
  const okPass = safeEqual(password, config.admin.password);
  return okUser && okPass;
}

/** Emite um token de sessão válido por {@link SESSION_TTL_MS}. */
export function issueToken(): string {
  const exp = String(Date.now() + SESSION_TTL_MS);
  return `${exp}.${hmac(exp)}`;
}

/** Valida assinatura e expiração de um token de sessão. */
export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, hmac(exp))) return false;
  const expMs = Number(exp);
  return Number.isFinite(expMs) && expMs > Date.now();
}

/** Lê um cookie do header `Cookie` sem depender de cookie-parser. */
export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

/** Grava o cookie de sessão (Secure só em produção, sob HTTPS). */
export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    path: "/admin",
    maxAge: SESSION_TTL_MS,
  });
}

/** Apaga o cookie de sessão (logout). */
export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/admin" });
}

/** True quando a requisição traz uma sessão de admin válida. */
export function isAuthenticated(req: Request): boolean {
  return verifyToken(readCookie(req, SESSION_COOKIE));
}

/**
 * Middleware: exige sessão válida. Sem sessão, GET redireciona para o login e os
 * demais métodos respondem 401 — o painel não expõe nada sem autenticação.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (isAuthenticated(req)) return next();
  if (req.method === "GET") {
    res.redirect("/admin/login");
    return;
  }
  res.status(401).send("Não autenticado.");
}

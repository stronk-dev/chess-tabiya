import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";

import { ServerError } from "./errors.js";
import type { Learner, RunStorage, StoredLearner } from "./storage.js";
import type { Principal } from "./authorization.js";

const SCRYPT_OPTIONS = Object.freeze({ N: 16_384, r: 8, p: 1 });
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const HANDLE = /^[a-z0-9][a-z0-9_-]{2,31}$/;

export interface IdentityOptions {
  readonly now?: () => Date;
  readonly randomBytes?: (size: number) => Buffer;
  readonly randomUUID?: () => string;
  readonly derive?: (password: string, salt: Buffer) => Promise<Buffer>;
  readonly cookieSecure?: boolean;
}

export interface AuthenticatedSession {
  readonly learner: Learner;
  readonly token: string;
  readonly cookie: string;
}

function invalid(message: string): never {
  throw new ServerError("INVALID_REQUEST", message);
}

function normalizeHandle(value: string): string {
  const handle = value.toLowerCase();
  if (!HANDLE.test(handle)) invalid("handle must match /^[a-z0-9][a-z0-9_-]{2,31}$/");
  return handle;
}

function validatePassword(password: string): void {
  if (password.length < 10 || password.length > 256) {
    invalid("password must be between 10 and 256 characters");
  }
}

function parseHash(value: string): { readonly salt: Buffer; readonly key: Buffer } | undefined {
  const match = /^scrypt\$N=16384,r=8,p=1\$([A-Za-z0-9_-]+)\$([A-Za-z0-9_-]+)$/.exec(value);
  if (match === null) return undefined;
  try {
    const salt = Buffer.from(match[1]!, "base64url");
    const key = Buffer.from(match[2]!, "base64url");
    return salt.length === 16 && key.length === 32 ? { salt, key } : undefined;
  } catch {
    return undefined;
  }
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class IdentityService {
  readonly #storage: RunStorage;
  readonly #now: () => Date;
  readonly #randomBytes: (size: number) => Buffer;
  readonly #randomUUID: () => string;
  readonly #derive: (password: string, salt: Buffer) => Promise<Buffer>;
  readonly #cookieSecure: boolean;
  readonly #dummyHash: Promise<string>;

  constructor(storage: RunStorage, options: IdentityOptions = {}) {
    this.#storage = storage;
    this.#now = options.now ?? (() => new Date());
    this.#randomBytes = options.randomBytes ?? randomBytes;
    this.#randomUUID = options.randomUUID ?? randomUUID;
    this.#derive =
      options.derive ??
      ((password, salt) =>
        new Promise<Buffer>((resolve, reject) => {
          nodeScrypt(password, salt, 32, SCRYPT_OPTIONS, (error, key) => {
            if (error !== null) reject(error);
            else resolve(Buffer.from(key));
          });
        }));
    this.#cookieSecure = options.cookieSecure ?? true;
    const salt = this.#randomBytes(16);
    this.#dummyHash = this.#encodeHash(this.#randomBytes(32).toString("base64url"), salt);
  }

  async register(input: {
    readonly handle: string;
    readonly password: string;
    readonly displayName?: string;
  }): Promise<AuthenticatedSession> {
    const handle = normalizeHandle(input.handle);
    validatePassword(input.password);
    if (input.displayName !== undefined && input.displayName.length > 64) {
      invalid("displayName cannot exceed 64 characters");
    }
    const createdAt = this.#now().toISOString();
    const passwordHash = await this.#encodeHash(input.password, this.#randomBytes(16));
    const learner = this.#storage.createLearner({
      id: `learner-${this.#randomUUID()}`,
      handle,
      displayName: input.displayName === undefined || input.displayName === ""
        ? handle
        : input.displayName,
      createdAt,
      passwordHash,
    });
    return this.#createSession(learner);
  }

  async login(handleInput: string, password: string): Promise<AuthenticatedSession> {
    validatePassword(password);
    const handle = handleInput.toLowerCase();
    const stored = this.#storage.learnerByHandle(handle);
    const parsed = stored === undefined ? undefined : parseHash(stored.passwordHash);
    const comparison = parsed ?? parseHash(await this.#dummyHash)!;
    const derived = await this.#derive(password, comparison.salt);
    const matches = timingSafeEqual(derived, comparison.key);
    const now = this.#now();
    const locked = stored?.lockedUntil !== undefined && stored.lockedUntil > now.toISOString();
    const validHandle = HANDLE.test(handle);
    if (stored === undefined || parsed === undefined || !validHandle || locked || !matches) {
      if (stored !== undefined && !locked) {
        this.#storage.recordLoginFailure(stored.id, now.toISOString());
      }
      throw new ServerError("UNAUTHENTICATED", "Invalid handle or password");
    }
    this.#storage.clearLoginFailures(stored.id);
    return this.#createSession(stored);
  }

  authenticate(cookieHeader: string | null): Principal {
    const token = this.#sessionToken(cookieHeader);
    if (token === undefined) {
      throw new ServerError("UNAUTHENTICATED", "Authentication required");
    }
    const learner = this.#storage.learnerBySessionToken(
      tokenHash(token),
      this.#now().toISOString(),
    );
    if (learner === undefined || learner.id === "__legacy") {
      throw new ServerError("UNAUTHENTICATED", "Authentication required");
    }
    return Object.freeze({ learnerId: learner.id, handle: learner.handle });
  }

  learner(principal: Principal): Learner {
    const learner = this.#storage.learnerById(principal.learnerId);
    if (learner === undefined) {
      throw new ServerError("UNAUTHENTICATED", "Authentication required");
    }
    return learner;
  }

  logout(cookieHeader: string | null): string {
    const token = this.#sessionToken(cookieHeader);
    if (token !== undefined) this.#storage.deleteSession(tokenHash(token));
    return this.expiredCookie();
  }

  async deleteAccount(principal: Principal, password: string): Promise<string> {
    validatePassword(password);
    const stored = this.#storage.learnerByHandle(principal.handle);
    const parsed = stored === undefined ? undefined : parseHash(stored.passwordHash);
    const comparison = parsed ?? parseHash(await this.#dummyHash)!;
    const derived = await this.#derive(password, comparison.salt);
    const matches = timingSafeEqual(derived, comparison.key);
    const now = this.#now();
    const locked = stored?.lockedUntil !== undefined && stored.lockedUntil > now.toISOString();
    if (stored === undefined || parsed === undefined || locked || !matches) {
      if (stored !== undefined) {
        if (!locked) this.#storage.recordLoginFailure(stored.id, now.toISOString());
      }
      throw new ServerError("UNAUTHENTICATED", "Invalid handle or password");
    }
    this.#storage.deleteLearner(principal.learnerId, this.#now().toISOString());
    return this.expiredCookie();
  }

  expiredCookie(): string {
    return `tabiya_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${this.#cookieSecure ? "; Secure" : ""}`;
  }

  async #encodeHash(password: string, salt: Buffer): Promise<string> {
    const key = await this.#derive(password, salt);
    return `scrypt$N=16384,r=8,p=1$${salt.toString("base64url")}$${key.toString("base64url")}`;
  }

  #createSession(learner: Learner): AuthenticatedSession {
    const token = this.#randomBytes(32).toString("base64url");
    const expiresAt = new Date(this.#now().getTime() + SESSION_SECONDS * 1000).toISOString();
    this.#storage.createSession(learner.id, tokenHash(token), expiresAt);
    return Object.freeze({ learner, token, cookie: this.#cookie(token) });
  }

  #cookie(token: string): string {
    return `tabiya_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${this.#cookieSecure ? "; Secure" : ""}`;
  }

  #sessionToken(header: string | null): string | undefined {
    if (header === null) return undefined;
    for (const part of header.split(";")) {
      const [name, ...rest] = part.trim().split("=");
      if (name === "tabiya_session") return rest.join("=") || undefined;
    }
    return undefined;
  }
}

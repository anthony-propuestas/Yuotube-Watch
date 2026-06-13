import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/tasks/route";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));

const mockGetDb = vi.mocked(getDb);
const mockGetSession = vi.mocked(getSession);

const SESSION = { user: { id: "user-1" } } as Awaited<ReturnType<typeof getSession>>;

function mockDb(overrides: { all?: unknown; first?: unknown } = {}) {
  const statement = {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue(overrides.all ?? { results: [] }),
    run: vi.fn().mockResolvedValue({}),
    first: vi.fn().mockResolvedValue(overrides.first ?? null),
  };
  const db = { prepare: vi.fn().mockReturnValue(statement) };
  mockGetDb.mockResolvedValue(db as never);
  return { db, statement };
}

function postRequest(body: unknown) {
  return new Request("http://localhost/api/tasks", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/tasks", () => {
  it("devuelve 401 sin sesión", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("devuelve las tasks del usuario con sesión", async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const tasks = [{ id: "t-1", user_id: "user-1", title: "Editar video" }];
    const { statement } = mockDb({ all: { results: tasks } });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tasks });
    expect(statement.bind).toHaveBeenCalledWith("user-1");
  });
});

describe("POST /api/tasks", () => {
  it("devuelve 401 sin sesión", async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await POST(postRequest({ title: "Algo" }));
    expect(res.status).toBe(401);
  });

  it("devuelve 400 si falta el título", async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(postRequest({}));
    expect(res.status).toBe(400);
  });

  it("devuelve 400 si el título es solo espacios", async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(postRequest({ title: "   " }));
    expect(res.status).toBe(400);
  });

  it("devuelve 400 con type inválido", async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(postRequest({ title: "Algo", type: "podcast" }));
    expect(res.status).toBe(400);
  });

  it("devuelve 400 con status inválido", async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const res = await POST(postRequest({ title: "Algo", status: "archived" }));
    expect(res.status).toBe(400);
  });

  it("crea la task y devuelve 201", async () => {
    mockGetSession.mockResolvedValue(SESSION);
    const created = { id: "t-1", user_id: "user-1", title: "Grabar short", status: "pending" };
    const { statement } = mockDb({ first: created });

    const res = await POST(postRequest({ title: "Grabar short", type: "short" }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ task: created });
    expect(statement.run).toHaveBeenCalled();
  });
});

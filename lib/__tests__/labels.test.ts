import { describe, expect, it } from "vitest";
import { STATUS_LABELS, TYPE_COLORS, TYPE_LABELS } from "@/lib/labels";
import type { TaskStatus, TaskType } from "@/lib/types";

const ALL_TYPES: TaskType[] = ["video", "short", "live", "community_post", "otro"];
const ALL_STATUSES: TaskStatus[] = ["pending", "in_progress", "done"];

describe("TYPE_LABELS", () => {
  it("cubre los 5 tipos con etiquetas no vacías", () => {
    expect(Object.keys(TYPE_LABELS).sort()).toEqual([...ALL_TYPES].sort());
    for (const type of ALL_TYPES) {
      expect(TYPE_LABELS[type]).toBeTruthy();
    }
  });
});

describe("STATUS_LABELS", () => {
  it("cubre los 3 estados con etiquetas no vacías", () => {
    expect(Object.keys(STATUS_LABELS).sort()).toEqual([...ALL_STATUSES].sort());
    for (const status of ALL_STATUSES) {
      expect(STATUS_LABELS[status]).toBeTruthy();
    }
  });
});

describe("TYPE_COLORS", () => {
  it("cubre los 5 tipos con clases de fondo y texto", () => {
    expect(Object.keys(TYPE_COLORS).sort()).toEqual([...ALL_TYPES].sort());
    for (const type of ALL_TYPES) {
      expect(TYPE_COLORS[type]).toMatch(/bg-/);
      expect(TYPE_COLORS[type]).toMatch(/text-/);
    }
  });
});

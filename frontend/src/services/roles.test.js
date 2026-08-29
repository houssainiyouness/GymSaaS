import { describe, expect, it } from "vitest";

import { homeForUser, isAdmin, isMember, roleLabel } from "./roles";

describe("rôles GymSaaS", () => {
  it("reconnaît SUPER_ADMIN", () => {
    expect(isAdmin({ role: "SUPER_ADMIN" })).toBe(true);
    expect(homeForUser({ role: "SUPER_ADMIN" })).toBe("/dashboard");
    expect(roleLabel({ role: "SUPER_ADMIN" })).toBe("Super-administrateur");
  });

  it("reconnaît COORDINATOR", () => {
    expect(isAdmin({ role: "COORDINATOR" })).toBe(true);
    expect(homeForUser({ role: "COORDINATOR" })).toBe("/dashboard");
  });

  it("reconnaît MEMBER", () => {
    expect(isAdmin({ role: "MEMBER" })).toBe(false);
    expect(isMember({ role: "MEMBER" })).toBe(true);
    expect(homeForUser({ role: "MEMBER" })).toBe("/client");
  });

  it("ne reconnaît jamais le rôle ADMIN inexistant", () => {
    expect(isAdmin({ role: "ADMIN" })).toBe(false);
  });
});

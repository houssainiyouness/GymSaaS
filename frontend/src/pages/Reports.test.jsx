import { describe, expect, it } from "vitest";

import { getDownloadFilename } from "./Reports";

describe("nom des exports CSV", () => {
  it("utilise le nom fourni par Django", () => {
    expect(getDownloadFilename('attachment; filename="membres_2026-08-21.csv"', "membres.csv"))
      .toBe("membres_2026-08-21.csv");
  });

  it("gère un nom UTF-8 et conserve une valeur de secours", () => {
    expect(getDownloadFilename("attachment; filename*=UTF-8''pr%C3%A9sences.csv", "presences.csv"))
      .toBe("présences.csv");
    expect(getDownloadFilename(undefined, "presences.csv")).toBe("presences.csv");
  });
});

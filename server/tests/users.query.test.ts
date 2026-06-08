import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseUsersQuery } from "../src/users/users.query";

describe("parseUsersQuery", () => {
  it("returns defaults for an empty query", () => {
    assert.deepEqual(parseUsersQuery({}), {
      page: 1,
      limit: 30,
      q: "",
      hobbies: [],
      nationalities: [],
      sortBy: "last_name",
      sortDir: "asc",
    });
  });

  it("normalizes pagination, search text, list filters, and sorting", () => {
    const query = parseUsersQuery({
      page: "2",
      limit: "250",
      q: "  Ann  ",
      hobbies: ["Yoga, Coding", "Yoga", "Photography"],
      nationalities: "Canadian, Turkish",
      sortBy: "firstName",
      sortDir: "DESC",
    });

    assert.deepEqual(query, {
      page: 2,
      limit: 100,
      q: "Ann",
      hobbies: ["Yoga", "Coding", "Photography"],
      nationalities: ["Canadian", "Turkish"],
      sortBy: "first_name",
      sortDir: "desc",
    });
  });

  it("falls back from invalid pagination and sorting values", () => {
    const query = parseUsersQuery({
      page: "-1",
      limit: "0",
      sortBy: "createdAt",
      sortDir: "sideways",
    });

    assert.equal(query.page, 1);
    assert.equal(query.limit, 30);
    assert.equal(query.sortBy, "last_name");
    assert.equal(query.sortDir, "asc");
  });
});

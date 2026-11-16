// Integration tests for the PHP API in api/.
//
// These send real HTTP requests to a running PHP server backed by MySQL and
// check the status, content type, and JSON structure of each response.
// API_URL must point at the folder that holds the .php files, for example:
//   API_URL=http://127.0.0.1:8000 npm run test:integration
// The GitHub Actions workflow starts PHP and MySQL and sets API_URL for you.
//
// Do not point this at the live site: the tests add colors to the database.

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error(
    "API_URL is not set. Start the API first, then run for example:\n" +
      "  API_URL=http://127.0.0.1:8000 npm run test:integration"
  );
}

// Seeded by tests/integration/setup.sql
const TEST_LOGIN = "testuser";
const TEST_PASSWORD = "testpass";

// POSTs a JSON body to an endpoint and returns the parsed response.
// Fails with the raw body if the endpoint does not return valid JSON,
// so PHP warnings or errors show up in the test output.
async function post(endpoint, body) {
  const response = await fetch(`${API_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body),
  });
  const text = await response.text();

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${endpoint} did not return valid JSON. Response body:\n${text}`);
  }

  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    json,
  };
}

describe("Login.php", () => {
  test("returns the user's id and name for a correct login", async () => {
    const { status, contentType, json } = await post("Login.php", {
      login: TEST_LOGIN,
      password: TEST_PASSWORD,
    });

    expect(status).toBe(200);
    expect(contentType).toMatch(/application\/json/);
    expect(json).toEqual({
      id: expect.any(Number),
      firstName: "Test",
      lastName: "User",
      error: "",
    });
    expect(json.id).toBeGreaterThan(0);
  });

  test("returns id 0 and an error for a wrong password", async () => {
    const { status, json } = await post("Login.php", {
      login: TEST_LOGIN,
      password: "wrong-password",
    });

    expect(status).toBe(200);
    expect(json).toEqual({
      id: 0,
      firstName: "",
      lastName: "",
      error: "No Records Found",
    });
  });
});

describe("AddColor.php and SearchColors.php", () => {
  // A unique name so repeated runs against the same database don't collide.
  const color = `CI Teal ${Date.now()}`;
  let userId;

  beforeAll(async () => {
    const { json } = await post("Login.php", {
      login: TEST_LOGIN,
      password: TEST_PASSWORD,
    });
    userId = json.id;
  });

  test("AddColor.php saves a color and returns an empty error", async () => {
    const { status, contentType, json } = await post("AddColor.php", {
      color,
      userId,
    });

    expect(status).toBe(200);
    expect(contentType).toMatch(/application\/json/);
    expect(json).toEqual({ error: "" });
  });

  test("SearchColors.php finds the added color by part of its name", async () => {
    const { status, contentType, json } = await post("SearchColors.php", {
      search: color.slice(3), // "Teal <timestamp>"
      userId,
    });

    expect(status).toBe(200);
    expect(contentType).toMatch(/application\/json/);
    expect(json.error).toBe("");
    expect(Array.isArray(json.results)).toBe(true);
    expect(json.results).toContain(color);
  });

  test("SearchColors.php returns an error and no results when nothing matches", async () => {
    const { status, json } = await post("SearchColors.php", {
      search: `no-such-color-${Date.now()}`,
      userId,
    });

    expect(status).toBe(200);
    expect(json.error).toBe("No Records Found");
    expect(json).not.toHaveProperty("results");
  });

  test("SearchColors.php does not return another user's colors", async () => {
    const { json } = await post("SearchColors.php", {
      search: color,
      userId: userId + 1000,
    });

    expect(json.error).toBe("No Records Found");
    expect(json).not.toHaveProperty("results");
  });
});

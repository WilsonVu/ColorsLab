// Unit tests for the front-end helper functions in public/js/code.js.
// These run in Node with no browser, server, or database.

const {
  MAX_COLOR_LENGTH,
  validateColor,
  escapeHtml,
  formatColorList,
  parseCookie,
} = require("../../public/js/code.js");

describe("validateColor", () => {
  test("accepts a normal color name", () => {
    expect(validateColor("Blue")).toEqual({ valid: true, color: "Blue", error: "" });
  });

  test("trims spaces around the color", () => {
    expect(validateColor("  Light Blue  ")).toEqual({
      valid: true,
      color: "Light Blue",
      error: "",
    });
  });

  test("rejects an empty string", () => {
    expect(validateColor("")).toEqual({
      valid: false,
      color: "",
      error: "Please enter a color",
    });
  });

  test("rejects input that is only whitespace", () => {
    const result = validateColor("   \t  ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Please enter a color");
  });

  test.each([null, undefined, 42])("rejects non-string input (%p)", (input) => {
    expect(validateColor(input).valid).toBe(false);
  });

  test("accepts a name exactly at the length limit", () => {
    expect(validateColor("a".repeat(MAX_COLOR_LENGTH)).valid).toBe(true);
  });

  test("rejects a name over the length limit", () => {
    const result = validateColor("a".repeat(MAX_COLOR_LENGTH + 1));
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Color name must be 50 characters or less");
  });

  test("checks the length after trimming", () => {
    expect(validateColor("  " + "a".repeat(MAX_COLOR_LENGTH) + "  ").valid).toBe(true);
  });
});

describe("escapeHtml", () => {
  test("escapes characters that have meaning in HTML", () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;"
    );
  });

  test("leaves plain text alone", () => {
    expect(escapeHtml("Forest Green")).toBe("Forest Green");
  });
});

describe("formatColorList", () => {
  test("returns an empty string for an empty list", () => {
    expect(formatColorList([])).toBe("");
  });

  test("returns a single color as-is", () => {
    expect(formatColorList(["Red"])).toBe("Red");
  });

  test("puts each color on its own line", () => {
    expect(formatColorList(["Red", "Green", "Blue"])).toBe(
      "Red<br />\r\nGreen<br />\r\nBlue"
    );
  });

  test("escapes HTML in color names", () => {
    expect(formatColorList(["<b>Red</b>"])).toBe("&lt;b&gt;Red&lt;/b&gt;");
  });

  test.each([undefined, null, "Red"])(
    "returns an empty string when results is not an array (%p)",
    (results) => {
      expect(formatColorList(results)).toBe("");
    }
  );
});

describe("parseCookie", () => {
  test("reads the login cookie written by saveCookie", () => {
    expect(parseCookie("firstName=Test,lastName=User,userId=7")).toEqual({
      firstName: "Test",
      lastName: "User",
      userId: 7,
    });
  });

  test("ignores other cookies on the page", () => {
    expect(parseCookie("theme=dark; firstName=Test,lastName=User,userId=7")).toEqual({
      firstName: "Test",
      lastName: "User",
      userId: 7,
    });
  });

  test.each(["", undefined])("treats a missing cookie as logged out (%p)", (cookie) => {
    expect(parseCookie(cookie).userId).toBe(-1);
  });

  test("treats a non-numeric userId as logged out", () => {
    expect(parseCookie("firstName=Test,lastName=User,userId=abc").userId).toBe(-1);
  });
});

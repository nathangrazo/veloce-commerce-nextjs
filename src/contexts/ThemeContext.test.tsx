import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from "./ThemeContext";

function ThemeHarness() {
  const { mode, resolvedTheme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        Set Dark
      </button>
      <button type="button" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it("persists theme selection to localStorage and toggles the document .dark class", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    await user.click(screen.getByRole("button", { name: "Set Dark" }));

    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) ?? '""')).toBe("dark");

    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

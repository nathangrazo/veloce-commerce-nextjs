import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import {
  RECENTLY_VIEWED_STORAGE_KEY,
  RecentlyViewedProvider,
  useRecentlyViewed,
} from "./RecentlyViewedContext";
import type { Product } from "@/domain/types";

const mockProducts: Product[] = ["p1", "p2", "p3"].map((id) => ({
  id,
  slug: `slug-${id}`,
  name: `Product ${id}`,
  subtitle: "Sub",
  description: "Desc",
  priceCents: 1000,
  category: "Workspace",
  image: "/images/products/lamp.jpg",
  rating: 4.8,
  reviewCount: 10,
  stock: 5,
  specs: [],
}));

function RecentHarness() {
  const { recentIds, recordView, clearHistory } = useRecentlyViewed();
  return (
    <div>
      <span data-testid="ids">{recentIds.join(",")}</span>
      <button type="button" onClick={() => recordView("p1")}>
        View p1
      </button>
      <button type="button" onClick={() => recordView("p2")}>
        View p2
      </button>
      <button type="button" onClick={() => clearHistory()}>
        Clear
      </button>
    </div>
  );
}

describe("RecentlyViewedContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("maintains deduplicated LRU ordering and persists to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <RecentlyViewedProvider products={mockProducts}>
        <RecentHarness />
      </RecentlyViewedProvider>
    );

    await user.click(screen.getByRole("button", { name: "View p1" }));
    await user.click(screen.getByRole("button", { name: "View p2" }));
    await user.click(screen.getByRole("button", { name: "View p1" }));

    expect(screen.getByTestId("ids")).toHaveTextContent("p1,p2");
    expect(JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) ?? "[]")).toEqual([
      "p1",
      "p2",
    ]);

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByTestId("ids")).toHaveTextContent("");
  });
});

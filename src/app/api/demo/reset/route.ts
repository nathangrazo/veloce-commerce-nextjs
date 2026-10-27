import { NextResponse } from "next/server";
import { getOrCreateCartKey } from "@/server/session";
import { resetDemoData } from "@/server/store";

export async function POST() {
  const { cartKey } = await getOrCreateCartKey();
  await resetDemoData(cartKey);
  return NextResponse.json({ ok: true });
}

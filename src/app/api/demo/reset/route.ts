import { NextResponse } from "next/server";
import { getOrCreateCartKey, getSessionUserId } from "@/server/session";
import { resetUserDemoData } from "@/server/store";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in to reset your account demo data." },
      { status: 401 }
    );
  }

  const { cartKey } = await getOrCreateCartKey();
  await resetUserDemoData(userId, cartKey);
  return NextResponse.json({ ok: true });
}

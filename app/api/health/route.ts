import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/auth";

export async function GET() {
  const result = await healthCheck();
  return NextResponse.json(result, { status: result.status === "ok" ? 200 : 503 });
}

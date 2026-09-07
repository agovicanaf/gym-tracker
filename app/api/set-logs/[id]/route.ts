import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

// DELETE /api/set-logs/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = getSql();

  await sql`DELETE FROM set_logs WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}

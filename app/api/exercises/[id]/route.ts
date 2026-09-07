import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/exercises/:id  Body: { name?, target_sets?, target_reps? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, target_sets, target_reps } = body;

  const sql = getSql();
  const [existing] = await sql`SELECT * FROM exercises WHERE id = ${id}`;
  if (!existing) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  const [updated] = await sql`
    UPDATE exercises SET
      name = ${name?.trim() ?? existing.name},
      target_sets = ${target_sets ?? existing.target_sets},
      target_reps = ${target_reps ?? existing.target_reps}
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(updated);
}

// DELETE /api/exercises/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = getSql();

  await sql`DELETE FROM exercises WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/set-logs/:id  Body: { weight_kg?, reps?, rpe?, notes?, logged_at? }
// Geçmiş bir set kaydını düzenler (ağırlık, tekrar vb. sonradan düzeltilebilsin diye).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { weight_kg, reps, rpe, notes, logged_at } = body;

  const sql = getSql();
  const [existing] = await sql`SELECT * FROM set_logs WHERE id = ${id}`;
  if (!existing) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  if (weight_kg != null && (typeof weight_kg !== "number" || weight_kg <= 0)) {
    return NextResponse.json({ error: "Geçerli bir ağırlık girin" }, { status: 400 });
  }
  if (reps != null && (typeof reps !== "number" || reps <= 0)) {
    return NextResponse.json({ error: "Geçerli bir tekrar sayısı girin" }, { status: 400 });
  }

  const [updated] = await sql`
    UPDATE set_logs SET
      weight_kg = ${weight_kg ?? existing.weight_kg},
      reps = ${reps ?? existing.reps},
      rpe = ${rpe !== undefined ? rpe : existing.rpe},
      notes = ${notes !== undefined ? notes : existing.notes},
      logged_at = ${logged_at ?? existing.logged_at}
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(updated);
}

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

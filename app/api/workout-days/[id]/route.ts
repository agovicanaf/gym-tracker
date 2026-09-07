import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

// PATCH /api/workout-days/:id  Body: { name }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Geçersiz isim" }, { status: 400 });
  }

  const sql = getSql();
  const [updated] = await sql`
    UPDATE workout_days SET name = ${name.trim()} WHERE id = ${id} RETURNING *
  `;

  if (!updated) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

// DELETE /api/workout-days/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sql = getSql();

  await sql`DELETE FROM workout_days WHERE id = ${id}`;

  return NextResponse.json({ success: true });
}

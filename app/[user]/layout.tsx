import { notFound } from "next/navigation";
import { isValidUser } from "@/lib/db";
import TopNav from "@/components/TopNav";

export default async function UserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ user: string }>;
}) {
  const { user } = await params;

  if (!isValidUser(user)) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col bg-bg">
      <TopNav user={user} />
      <div className="flex-1">{children}</div>
    </div>
  );
}

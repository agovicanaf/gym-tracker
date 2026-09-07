import { redirect } from "next/navigation";

// Tek kullanıcılı sistem: giriş/seçim ekranına gerek yok, doğrudan
// Ömer'in programına yönlendiriyoruz.
export default function Home() {
  redirect("/omer");
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Person360 } from "@/components/person/Person360";
import { getPersonProfile } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/people/[id]">): Promise<Metadata> {
  const { id } = await params;
  const profile = await getPersonProfile(id);
  return { title: profile ? profile.person.fullName : "Perfil no encontrado" };
}

export default async function PersonPage({ params }: PageProps<"/people/[id]">) {
  const { id } = await params;
  const profile = await getPersonProfile(id);
  if (!profile) notFound();
  return <Person360 key={profile.person.id} profile={profile} />;
}

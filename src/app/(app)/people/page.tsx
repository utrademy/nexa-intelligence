import type { Metadata } from "next";
import { PeopleExplorer } from "@/components/people/PeopleExplorer";
import { getPeople } from "@/lib/data";

export const metadata: Metadata = { title: "Inteligencia de Personas" };

export default async function PeoplePage() {
  const { people, total, filterOptions } = await getPeople();
  return <PeopleExplorer people={people} total={total} filterOptions={filterOptions} />;
}

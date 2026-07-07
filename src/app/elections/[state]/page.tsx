import { notFound, redirect } from "next/navigation";

const texasStateSlugs = new Set(["texas", "tx"]);

export default async function ElectionStateAliasPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  if (texasStateSlugs.has(state.toLowerCase())) {
    redirect("/elections/texas");
  }

  notFound();
}

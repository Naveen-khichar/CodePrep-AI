export const dynamic = "force-dynamic";

import { problems } from "../../data/problems";
import CodeWorkspace from "./CodeWorkspace";
import ErrorBoundary from "../../components/ErrorBoundary";
import { notFound } from "next/navigation";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const problem = problems.find((p) => p.id === Number(id));

  if (!problem) {
    return notFound();
  }

  return (
    <div className="flex flex-col flex-grow bg-background">
      <ErrorBoundary>
        <CodeWorkspace problem={problem} />
      </ErrorBoundary>
    </div>
  );
}
import { problems } from "../../data/problems";
import CodeEditor from "./CodeEditor";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const problem = problems.find(
    (p) => p.id === Number(id)
  );

  if (!problem) return <div>Not found</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        {problem.title}
      </h1>

      <p className="my-4">
        {problem.description}
      </p>

      <CodeEditor />
    </div>
  );
}
import Link from "next/link";
import { problems } from "../data/problems";

export default function ProblemsPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-6">
        Problems
      </h1>

      {problems.map((problem) => (
        <Link
          key={problem.id}
          href={`/problems/${problem.id}`}
        >
          <div className="border p-4 rounded-lg mb-4">
            <h2 className="font-bold">
              {problem.title}
            </h2>

            <p>{problem.difficulty}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
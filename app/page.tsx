import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-4">
        CodePrep AI
      </h1>

      <p className="text-gray-500 mb-6">
        Practice coding interviews.
      </p>

      <Link
        href="/problems"
        className="bg-black text-white px-6 py-3 rounded-lg"
      >
        Start Practicing
      </Link>
    </main>
  );
}
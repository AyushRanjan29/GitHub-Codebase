import RepoInput from "../components/repoInput";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold">
            GitHub Codebase
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
            Analyze a GitHub repository and
            understand its codebase using AI.
          </p>
        </div>

        <RepoInput />
      </div>
    </main>
  );
}
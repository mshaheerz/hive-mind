import Dashboard from "@/app/components/Dashboard";

export const metadata = {
  title: "Feature Flag Manager"
};

export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Feature Flag Manager</h1>
      <Dashboard />
    </main>
  );
}

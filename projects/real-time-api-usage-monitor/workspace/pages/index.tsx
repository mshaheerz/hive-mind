import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home – MyApp",
  description: "Welcome to MyApp – a starter Next.js project with Tailwind CSS and Redux.",
};

export default function HomePage() {
  return (
    <section className="text-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Welcome to MyApp!
      </h1>
      <p className="text-lg text-gray-600">
        This is the home page built with Next.js, Tailwind CSS, and Lucide icons.
      </p>
    </section>
  );
}

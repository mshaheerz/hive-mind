import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About – MyApp",
  description: "Learn more about MyApp and its features.",
};

export default function AboutPage() {
  return (
    <section className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold mb-4">About MyApp</h1>
      <p className="text-gray-700 leading-relaxed">
        MyApp is a minimal starter template that demonstrates a clean
        architecture using Next.js (App Router), React, Tailwind CSS, Redux,
        and Lucide icons. It includes a simple authentication mock, global
        state handling, and a responsive layout.
      </p>
    </section>
  );
}

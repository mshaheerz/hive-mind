import Layout from '../components/Layout';
import { Calendar, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <Layout>
      <section className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Welcome to MyApp</h1>

        <p className="text-lg text-gray-700">
          A starter template built with Next.js, Tailwind CSS and Lucide icons.
        </p>

        <div className="flex justify-center gap-8 mt-8">
          <div className="flex flex-col items-center">
            <Calendar size={48} className="text-indigo-600" />
            <span className="mt-2">Fast Scheduling</span>
          </div>

          <div className="flex flex-col items-center">
            <CheckCircle size={48} className="text-green-600" />
            <span className="mt-2">Reliable Performance</span>
          </div>
        </div>
      </section>
    </Layout>
  );
}

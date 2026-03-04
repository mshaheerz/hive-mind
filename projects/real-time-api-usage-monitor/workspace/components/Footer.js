export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-4 mt-auto">
      <div className="container mx-auto text-center text-sm">
        © {new Date().getFullYear()} MyApp. All rights reserved.
      </div>
    </footer>
  );
}

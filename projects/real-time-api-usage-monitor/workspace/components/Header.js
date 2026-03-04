import Link from "next/link";
import { Home, Info } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-gray-800 text-white shadow">
      <nav className="container mx-auto flex items-center justify-between p-4">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center space-x-2 hover:text-gray-300">
          <Home className="w-6 h-6" />
          <span className="font-semibold text-lg">MyApp</span>
        </Link>

        {/* Navigation Links */}
        <ul className="flex space-x-6">
          <li>
            <Link
              href="/"
              className="flex items-center space-x-1 hover:text-gray-300"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              className="flex items-center space-x-1 hover:text-gray-300"
            >
              <Info className="w-4 h-4" />
              <span>About</span>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

// app/components/Header.js
import Link from "next/link";
import { Menu, Sun, Moon } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo / Brand */}
        <div className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
          <Menu className="h-6 w-6" />
          <span className="font-semibold text-xl">MyApp</span>
        </div>

        {/* Navigation links */}
        <div className="hidden md:flex space-x-6">
          <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600">
            Home
          </Link>
          <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600">
            About
          </Link>
        </div>

        {/* Theme toggle placeholder */}
        <button
          aria-label="Toggle dark mode"
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <Sun className="h-5 w-5 hidden dark:inline" />
          <Moon className="h-5 w-5 dark:hidden" />
        </button>
      </nav>
    </header>
  );
}

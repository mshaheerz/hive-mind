// app/pages/index.js
"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PlusCircle } from "lucide-react";
import { addData } from "../actions/server-action";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/data");
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();
        setItems(data);
      } catch (e) {
        setError(e.message);
      }
    };
    fetchData();
  }, []);

  // Handle form submit using the server action
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    setError("");
    try {
      // Server Action receives a FormData object
      const formData = new FormData();
      formData.append("name", newName.trim());

      // The server action returns the newly created item
      const created = await addData(formData);
      setItems((prev) => [...prev, created]);
      setNewName("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Data List</h1>

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Add new item form */}
        <form onSubmit={handleAdd} className="flex items-center mb-6 space-x-2">
          <input
            type="text"
            placeholder="Enter name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            <PlusCircle className="h-5 w-5 mr-1" />
            Add
          </button>
        </form>

        {/* List of items */}
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="p-4 bg-white dark:bg-gray-700 rounded shadow-sm flex justify-between items-center"
            >
              <span>{item.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-300">
                ID: {item.id}
              </span>
            </li>
          ))}
        </ul>
      </main>

      <Footer />
    </div>
  );
}

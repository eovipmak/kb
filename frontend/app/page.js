// frontend/app/page.js
import Link from 'next/link';
import SearchBar from '../components/SearchBar';

async function getCategories() {
  // In a real app, use absolute URL or env var
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, { cache: 'no-store' });
  if (!res.ok) {
     // fallback if backend is down
     return [];
  }
  return res.json();
}

export default async function Home() {
  const categories = await getCategories();

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
          How can we help?
        </h1>
        <div className="mt-8 max-w-xl mx-auto">
          <SearchBar />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">
                {category.name}
              </h3>
              <ul className="mt-4 space-y-2">
                {category.topics.map((topic) => (
                  <li key={topic.id}>
                    <Link href={`/topic/${topic.slug}`} className="text-gray-600 hover:text-blue-600">
                      {topic.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="col-span-3 text-center text-gray-500">
            Backend might be starting up or no categories found.
          </p>
        )}
      </div>
    </div>
  );
}

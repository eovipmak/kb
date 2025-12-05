// frontend/app/search/page.js
import Link from 'next/link';
import SearchBar from '../../components/SearchBar';

async function searchQuestions(q) {
  if (!q) return [];
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search?q=${q}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function SearchPage({ searchParams }) {
  const q = searchParams.q || '';
  const results = await searchQuestions(q);

  return (
    <div>
      <div className="mb-8 max-w-xl mx-auto">
        <SearchBar />
      </div>

      <h1 className="text-2xl font-bold mb-4">Search Results for "{q}"</h1>
      
      {results.length === 0 ? (
        <p className="text-gray-500">No results found.</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {results.map((question) => (
              <li key={question.slug}>
                <Link href={`/questions/${question.slug}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                     <p 
                       className="text-lg font-medium text-blue-600 truncate"
                       dangerouslySetInnerHTML={{ __html: question.title }}
                     />
                     <p 
                       className="text-sm text-gray-500 mt-1"
                       dangerouslySetInnerHTML={{ __html: question.snippet }}
                     />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

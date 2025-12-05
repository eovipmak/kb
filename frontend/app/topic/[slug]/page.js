// frontend/app/topic/[slug]/page.js
import Link from 'next/link';

// NOTE: This route assumes we have an API to get topic details. 
// I didn't explicitly create it in backend plan, but I can fetch all categories and filter 
// or I should've added /topics/:slug. I'll mock it for now or add it later.
// For now, let's fetch categories and find the topic.

async function getTopic(slug) {
  const res = await fetch('http://localhost:3001/categories', { cache: 'no-store' });
  if (!res.ok) return null;
  const categories = await res.json();
  
  for (const cat of categories) {
    const topic = cat.topics.find(t => t.slug === slug);
    if (topic) return topic;
  }
  return null;
}

// Ideally, we need a "Get Questions by Topic" endpoint.
// I will add a backend route for this quickly in the next turn if needed.
// For now, I'll just show the placeholder.

export default async function TopicPage({ params }) {
  const { slug } = params;
  const topic = await getTopic(slug);

  if (!topic) {
    return <div>Topic not found</div>;
  }

  // TODO: Fetch questions for this topic
  // const questions = await getQuestionsByTopic(topic.id);
  const questions = [
    { title: 'How to setup VPS', slug: 'setup-vps' }, // Mock
  ];

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Home
        </Link>
      </div>
      <h1 className="mb-8">{topic.name}</h1>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {questions.map((question) => (
            <li key={question.slug}>
              <Link href={`/questions/${question.slug}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {question.title}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

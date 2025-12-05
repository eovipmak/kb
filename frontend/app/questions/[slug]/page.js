// frontend/app/questions/[slug]/page.js
import { notFound } from 'next/navigation';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

async function getQuestion(slug) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/questions/${slug}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch question');
  return res.json();
}

export default async function QuestionPage({ params }) {
  const { slug } = params;
  const question = await getQuestion(slug);

  if (!question) {
    notFound();
  }

  // Parse Markdown
  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(question.content || '');
  
  const contentHtml = processedContent.toString();

  return (
    <div className="max-w-4xl mx-auto">
       <div className="mb-6">
        <Link href={`/topic/${question.topic.slug}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to {question.topic.name}
        </Link>
      </div>
      
      <article className="bg-white px-8 py-10 shadow-sm rounded-lg border">
        <header className="mb-8 border-b pb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{question.title}</h1>
          
          <div className="flex items-center text-sm text-gray-500 space-x-4">
             {question.author && (
               <div className="flex items-center">
                 <span className="font-medium text-gray-900 mr-2">{question.author.name}</span>
                 <span>• {question.author.role}</span>
               </div>
             )}
             <span>Last updated: {new Date(question.updatedAt).toLocaleDateString()}</span>
          </div>
        </header>
        
        <div 
          className="prose prose-blue max-w-none"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
        
        <div className="mt-12 pt-8 border-t">
          <h3 className="text-lg font-medium">Was this article helpful?</h3>
          {/* Feedback Component Placeholder */}
          <div className="flex gap-4 mt-4">
            <button className="px-4 py-2 border rounded hover:bg-gray-50">👍 Yes</button>
            <button className="px-4 py-2 border rounded hover:bg-gray-50">👎 No</button>
          </div>
        </div>

        {question.relatedQuestions && question.relatedQuestions.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-xl font-bold mb-4">Related Articles</h3>
            <ul className="space-y-3">
              {question.relatedQuestions.map((related) => (
                <li key={related.slug}>
                  <Link href={`/questions/${related.slug}`} className="text-blue-600 hover:underline">
                    {related.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
}

import Link from 'next/link';

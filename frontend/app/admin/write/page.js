// frontend/app/admin/write/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Load Editor client-side only
const Editor = dynamic(() => import('../../../components/Editor'), { ssr: false });

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    topicId: '',
    status: 'DRAFT',
    // Mock user ID for now, in real app get from session
    authorId: 'f17a0cb1-e2c1-4ff9-94bf-121f6d09148b' 
  });
  
  const [categories, setCategories] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    // Fetch Categories for dropdown
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
      .then(res => res.json())
      .then(data => setCategories(data));
      
    // Fetch existing question if ID is present
    if (id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/questions/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        })
        .then(data => {
          setFormData({
            title: data.title,
            slug: data.slug,
            content: data.content,
            topicId: data.topicId,
            status: data.status,
            authorId: data.authorId
          });
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });

      // Fetch Versions
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/questions/${id}/versions`)
        .then(res => res.json())
        .then(data => setVersions(data));
    }
  }, [id]);

  const handleRestore = async (versionId) => {
    if (!confirm('Are you sure you want to restore this version? Current content will be saved as a new version.')) return;
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/questions/${id}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId })
    });

    if (res.ok) {
      // Reload page to see changes
      window.location.reload();
    } else {
      alert('Failed to restore version');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = id 
      ? `http://localhost:3001/admin/questions/${id}`
      : 'http://localhost:3001/admin/questions';
      
    const method = id ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      router.push('/admin');
    } else {
      alert('Error saving question');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Edit Question' : 'New Question'}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input 
              type="text" 
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Slug</label>
            <input 
              type="text" 
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.slug}
              onChange={e => setFormData({...formData, slug: e.target.value})}
            />
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Topic</label>
            <select 
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={formData.topicId}
              onChange={e => setFormData({...formData, topicId: e.target.value})}
            >
              <option value="">Select a Topic</option>
              {categories.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  {cat.topics.map(topic => (
                     <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
          <Editor 
            content={formData.content} 
            onChange={(html) => setFormData({...formData, content: html})} 
          />
          <p className="text-xs text-gray-500 mt-1">
             * Note: Editor currently saves HTML. 
          </p>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
           <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="status" 
                  value="DRAFT" 
                  checked={formData.status === 'DRAFT'}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                />
                <span className="ml-2 text-sm text-gray-700">Draft</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="status" 
                  value="REVIEW" 
                  checked={formData.status === 'REVIEW'}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                />
                <span className="ml-2 text-sm text-gray-700">Review</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="status" 
                  value="PUBLISHED" 
                  checked={formData.status === 'PUBLISHED'}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                />
                <span className="ml-2 text-sm font-bold text-green-700">Publish</span>
              </label>
           </div>
           
           <button 
             type="submit" 
             className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
           >
             Save Question
           </button>
        </div>
      </form>

      {/* Version History Section */}
      {id && versions.length > 0 && (
        <div className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-bold mb-4">Version History</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {versions.map((version) => (
                <li key={version.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {version.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Edited by {version.editor?.name || 'Unknown'} on {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(version.id)}
                    className="ml-4 bg-white border border-gray-300 rounded-md shadow-sm px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

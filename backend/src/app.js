// backend/src/app.js
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const prisma = require('./lib/prisma');
const { indexDocument, client } = require('./lib/meili');

// Register plugins
fastify.register(cors, {
  origin: true, // Allow all for dev
});

// Basic Health Check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// --- Public Routes ---

// Get all Categories with Topics
fastify.get('/categories', async (request, reply) => {
  const categories = await prisma.category.findMany({
    include: {
      topics: true
    }
  });
  return categories;
});

// Get Question by Slug (Public)
fastify.get('/questions/:slug', async (request, reply) => {
  const { slug } = request.params;
  const question = await prisma.question.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      author: {
        select: { name: true, avatarUrl: true, role: true, bio: true }
      },
      topic: {
        include: { category: true }
      },
      tags: true
    }
  });

  if (!question) {
    reply.code(404).send({ error: 'Question not found' });
    return;
  }

  // Fetch related questions (same topic)
  const relatedQuestions = await prisma.question.findMany({
    where: {
      topicId: question.topicId,
      id: { not: question.id },
      status: 'PUBLISHED'
    },
    take: 5,
    select: { title: true, slug: true }
  });

  return { ...question, relatedQuestions };
});

// Search (Meilisearch with DB fallback)
fastify.get('/search', async (request, reply) => {
  const { q } = request.query;
  if (!q) return [];

  try {
    const search = await client.index('questions').search(q, {
      attributesToHighlight: ['content', 'title'],
      attributesToCrop: ['content'],
      cropLength: 30,
      limit: 10
    });

    if (search.hits.length > 0) {
      return search.hits.map(hit => ({
        id: hit.id,
        title: hit._formatted.title || hit.title,
        slug: hit.slug,
        // Use the highlighted content snippet
        snippet: hit._formatted.content || hit.content
      }));
    }
  } catch (e) {
    request.log.error(e);
    // Fallback to DB if Meilisearch is down
  }
  
  const results = await prisma.question.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: q } },
        { content: { contains: q } }
      ]
    },
    take: 10
  });
  
  // Map DB results to match Meilisearch structure
  return results.map(r => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    snippet: r.content.substring(0, 150) + '...'
  }));
});

// Submit Feedback
fastify.post('/feedback', async (request, reply) => {
  const { questionId, isHelpful } = request.body;
  // Simple IP check (mocked)
  const ipAddress = request.ip; 
  
  await prisma.feedback.create({
    data: {
      questionId,
      isHelpful,
      ipAddress
    }
  });
  
  return { success: true };
});

// --- Admin Routes (Mock Auth for now) ---

// Get Single Question (Admin - includes Drafts)
fastify.get('/admin/questions/:id', async (request, reply) => {
  const { id } = request.params;
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      topic: true
    }
  });
  if (!question) {
    reply.code(404).send({ error: 'Question not found' });
    return;
  }
  return question;
});

// Get Question Versions
fastify.get('/admin/questions/:id/versions', async (request, reply) => {
  const { id } = request.params;
  const versions = await prisma.questionVersion.findMany({
    where: { questionId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      editor: {
        select: { name: true }
      }
    }
  });
  return versions;
});

// Restore Question Version
fastify.post('/admin/questions/:id/restore', async (request, reply) => {
  const { id } = request.params;
  const { versionId } = request.body;

  const version = await prisma.questionVersion.findUnique({
    where: { id: versionId }
  });

  if (!version) {
    reply.code(404).send({ error: 'Version not found' });
    return;
  }

  // Create a new version of the CURRENT state before overwriting (safety net)
  const current = await prisma.question.findUnique({ where: { id } });
  if (current) {
    await prisma.questionVersion.create({
      data: {
        questionId: id,
        content: current.content,
        title: current.title,
        editorId: current.authorId // simplified
      }
    });
  }

  // Restore content
  const updated = await prisma.question.update({
    where: { id },
    data: {
      title: version.title,
      content: version.content
    }
  });

  return updated;
});

// Create Question
fastify.post('/admin/questions', async (request, reply) => {
  const { title, content, slug, topicId, authorId, tags } = request.body;
  
  // Create Question
  const question = await prisma.question.create({
    data: {
      title,
      content,
      slug,
      topicId,
      authorId, // In real app, get from session
      status: 'DRAFT'
    }
  });
  
  return question;
});

// Update Question (Draft -> Review -> Publish)
fastify.put('/admin/questions/:id', async (request, reply) => {
  const { id } = request.params;
  const { title, content, status, editorId } = request.body;
  
  // Get current to save version
  const current = await prisma.question.findUnique({ where: { id } });
  
  if (current) {
    // Save version
    await prisma.questionVersion.create({
      data: {
        questionId: id,
        content: current.content,
        title: current.title,
        editorId: editorId || current.authorId // fallback
      }
    });
  }
  
  const updated = await prisma.question.update({
    where: { id },
    data: {
      title,
      content,
      status
    }
  });
  
  // Index to Meilisearch if Published
  if (status === 'PUBLISHED') {
    await indexDocument('questions', {
      id: updated.id,
      title: updated.title,
      content: updated.content,
      slug: updated.slug
    });
  }
  
  return updated;
});

// List Questions (Admin)
fastify.get('/admin/questions', async (request, reply) => {
  const questions = await prisma.question.findMany({
    include: {
      topic: true,
      author: true
    },
    orderBy: { updatedAt: 'desc' }
  });
  return questions;
});

// Seed Endpoint (For dev convenience)
fastify.post('/seed', async (request, reply) => {
  // Create Author
  const author = await prisma.user.upsert({
    where: { email: 'writer@example.com' },
    update: {},
    create: {
      email: 'writer@example.com',
      name: 'Tech Support',
      role: 'WRITER',
      bio: 'Senior Support Engineer'
    }
  });
  
  // Create Category
  const cat = await prisma.category.upsert({
    where: { slug: 'hosting-basics' },
    update: {},
    create: {
      name: 'Hosting Basics',
      slug: 'hosting-basics'
    }
  });
  
  // Create Topic
  const topic = await prisma.topic.upsert({
    where: { slug: 'getting-started' },
    update: {},
    create: {
      name: 'Getting Started',
      slug: 'getting-started',
      categoryId: cat.id
    }
  });
  
  return { author, cat, topic };
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

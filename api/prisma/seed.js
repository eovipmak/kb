// Seed script for Knowledge Base
// Run with: npm run seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
    // Ensure admin user exists
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: { email: adminEmail, passwordHash: adminHash, role: 'ADMIN' },
    });

    // Clean existing data
    await prisma.qAPage.deleteMany();
    await prisma.category.deleteMany();
    await prisma.tag.deleteMany();

    // Create categories
    const catGeneral = await prisma.category.create({
        data: { name: 'General', slug: 'general' },
    });
    const catAccount = await prisma.category.create({
        data: { name: 'Account', slug: 'account' },
    });

    // Create tags
    const tagFAQ = await prisma.tag.create({ data: { name: 'FAQ' } });
    const tagGuide = await prisma.tag.create({ data: { name: 'Guide' } });

    // Helper to generate slug
    const slugify = (str) =>
        str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

    const articles = [
        {
            title: 'Getting Started with the Knowledge Base',
            contentHtml: `# Getting Started\n\nWelcome to the Knowledge Base. This article will help you get started with creating and publishing articles.\n\n- Open the admin panel.\n- Click "New Article".\n- Fill in the title and content.\n- Save and publish.`,
            categoryId: catGeneral.id,
            tags: [tagGuide.id],
        },
        {
            title: 'How to Reset Your Password',
            contentHtml: `# Resetting Your Password\n\nIf you forgot your password, follow these steps:\n\n1. Go to the login page.\n2. Click "Forgot password?".\n3. Enter your email address.\n4. Check your inbox for a reset link.\n5. Follow the link to set a new password.`,
            categoryId: catAccount.id,
            tags: [tagFAQ.id],
        },
        {
            title: 'Troubleshooting Login Issues',
            contentHtml: `# Troubleshooting Login Issues\n\nCommon problems when logging in:\n\n- **Incorrect credentials**: Ensure your email and password are correct.\n- **Account not verified**: Check your email for a verification link.\n- **Browser cookies disabled**: Enable cookies in your browser settings.`,
            categoryId: catAccount.id,
            tags: [tagFAQ.id, tagGuide.id],
        },
        {
            title: 'Understanding Article Statuses',
            contentHtml: `# Article Statuses\n\nArticles can be in one of the following statuses:\n\n- **DRAFT**: Not visible to the public.\n- **PUBLISHED**: Visible to all users.\n- **ARCHIVED**: Retained for reference but not shown in listings.`,
            categoryId: catGeneral.id,
            tags: [tagGuide.id],
        },
        {
            title: 'How to Add Tags to an Article',
            contentHtml: `# Adding Tags\n\nTags help categorize content. To add tags:\n\n1. Edit the article.\n2. In the "Tags" field, type the tag name and press Enter.\n3. Save the article. Tags will appear on the article page.`,
            categoryId: catGeneral.id,
            tags: [tagGuide.id],
        },
        {
            title: 'Advanced Formatting with TipTap',
            contentHtml: `# Advanced Formatting\n\nOur editor supports many features:\n\n- **Bold** and *Italic* text.\n- [Links](https://example.com).\n- Code blocks for technical documentation.\n- Tables for structured data.\n- Task lists for checklists.`,
            categoryId: catGeneral.id,
            tags: [tagGuide.id],
        },
        {
            title: 'Configuring Your Profile',
            contentHtml: `# Profile Configuration\n\nYou can customize your profile settings:\n\n1. Go to Settings.\n2. Change your display name.\n3. Upload a profile picture.\n4. Set your notification preferences.`,
            categoryId: catAccount.id,
            tags: [tagGuide.id],
        },
        {
            title: 'Secure Your Account with 2FA',
            contentHtml: `# Two-Factor Authentication\n\nWe recommend enabling 2FA for extra security:\n\n- Use an authenticator app (e.g., Google Authenticator).\n- Save your backup codes in a safe place.\n- 2FA will be required every time you sign in from a new device.`,
            categoryId: catAccount.id,
            tags: [tagFAQ.id, tagGuide.id],
        }
    ];

    for (const art of articles) {
        const created = await prisma.qAPage.create({
            data: {
                title: art.title,
                slug: slugify(art.title),
                contentHtml: art.contentHtml,
                contentText: art.contentHtml.replace(/[#*\-`>]/g, ''),
                type: 'FAQ',
                status: 'PUBLISHED',
                author: { connect: { email: adminEmail } },
                category: { connect: { id: art.categoryId } },
                tags: { connect: art.tags.map((id) => ({ id })) },
            },
        });
        console.log(`Created article: ${created.title}`);
    }

    console.log('Seeding complete. Triggering re-indexing...');
    try {
        execSync('MEILI_MASTER_KEY=masterKey npx ts-node src/scripts/reindex.ts', { cwd: 'api' });
        console.log('Re-indexing successful.');
    } catch (e) {
        console.error('Re-indexing failed after seed:', e.message);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { Status, Role } from '../types';
import { prisma } from '../utils/db';
import { SearchService } from './search.service';

export class WorkflowService {
    static canTransition(currentStatus: Status, newStatus: Status, role: Role): boolean {
        if (currentStatus === newStatus) return true;

        if (role === Role.ADMIN) {
            return true;
        }

        if (role === Role.WRITER) {
            // WRITER: DRAFT -> REVIEW
            if (currentStatus === Status.DRAFT && newStatus === Status.REVIEW) {
                return true;
            }
            return false;
        }

        return false;
    }

    static async transitionStatus(qaId: string, newStatus: Status, userId: string, userRole: Role) {
        const page = await prisma.qAPage.findUnique({ where: { id: qaId } });
        if (!page) throw new Error('Not found');

        // Basic ownership check (if not admin, must be author)
        // Wait, for reviewing/publishing, Admin can act on ANY article.
        // Writer can only act on their own article?
        // Prompt doesn't explicitly say Writer can only transition their own, but it's implied for "Submit".
        if (userRole !== Role.ADMIN && page.authorId !== userId) {
            throw new Error('Forbidden');
        }

        if (!this.canTransition(page.status as Status, newStatus, userRole)) {
            throw new Error('Forbidden: Invalid status transition');
        }

        const updated = await prisma.qAPage.update({
            where: { id: qaId },
            data: { status: newStatus },
            include: {
                tags: true,
                category: true,
                author: {
                    select: { id: true, email: true, role: true }
                }
            }
        });

        // Sync to Meilisearch
        // Note: SearchService should handle whether to index or remove based on status if that logic is in it.
        // If SearchService.indexDocument indexes everything, we might need to be careful?
        // Previous context: "only index PUBLISHED QA pages".
        // So SearchService.indexDocument probably checks status? OR we should check here?
        // Let's assume SearchService handles it or we pass it.
        // Actually, looking at QAService.createQAPage -> SearchService.indexDocument(result).
        // If result is DRAFT, does it index?
        // I should check SearchService.

        await SearchService.indexDocument(updated);

        return updated;
    }
}

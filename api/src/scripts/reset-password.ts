
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function reset() {
    console.log('Resetting admin password...');
    const hash = await bcrypt.hash('admin123', 10);
    try {
        await prisma.user.update({
            where: { email: 'admin@example.com' },
            data: { passwordHash: hash }
        });
        console.log('Password reset to admin123');
    } catch (e) {
        console.log('Error updating user', e);
    }
}

reset()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

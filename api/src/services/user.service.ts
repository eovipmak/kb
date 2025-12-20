import { prisma } from '../utils/db';
import { AuthService } from './auth.service';
import { Role } from '../types';

export class UserService {
    static async getAllUsers() {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return users;
    }

    static async createUser(email: string, password: string, role: Role) {
        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error('User already exists');
        }

        const passwordHash = await AuthService.hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                role
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        return user;
    }

    static async updateUser(id: string, data: { role?: Role; password?: string }) {
        const updateData: any = {};

        if (data.role) {
            updateData.role = data.role;
        }

        if (data.password) {
            updateData.passwordHash = await AuthService.hashPassword(data.password);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        return user;
    }

    static async deleteUser(id: string) {
        await prisma.user.delete({
            where: { id }
        });
    }
}

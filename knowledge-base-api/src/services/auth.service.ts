import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '../types';

const SALT_ROUNDS = 10;

export class AuthService {
    private static get secret() {
        return process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
    }

    private static get expiresIn() {
        return process.env.JWT_EXPIRES_IN || '7d';
    }
    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    static generateToken(userId: string, role: Role): string {
        return jwt.sign({ id: userId, role }, this.secret, {
            expiresIn: this.expiresIn as any,
        });
    }

    static verifyToken(token: string): any {
        return jwt.verify(token, this.secret);
    }
}

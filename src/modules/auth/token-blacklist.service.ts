import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

// Define a schema for blacklisted tokens
export interface BlacklistedToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class TokenBlacklistService {
  constructor(
    // In production, use Redis or create a MongoDB model for this
    // @InjectModel('BlacklistedToken') private blacklistModel: Model<BlacklistedToken>
  ) {}

  private blacklistedTokens = new Set<string>(); // Temporary in-memory storage

  async addToBlacklist(token: string, expiresAt: Date): Promise<void> {
    const cleanToken = token.replace('Bearer ', '');
    this.blacklistedTokens.add(cleanToken);
    
    // In production with Redis:
    // await this.redisClient.setex(cleanToken, expiresAt.getTime() - Date.now(), 'blacklisted');
    
    // Or with MongoDB:
    // await this.blacklistModel.create({ token: cleanToken, expiresAt, createdAt: new Date() });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const cleanToken = token.replace('Bearer ', '');
    return this.blacklistedTokens.has(cleanToken);
    
    // In production with Redis:
    // return !!(await this.redisClient.get(cleanToken));
    
    // Or with MongoDB:
    // const result = await this.blacklistModel.findOne({ token: cleanToken, expiresAt: { $gt: new Date() } });
    // return !!result;
  }

  async cleanup(): Promise<void> {
    // In production, implement cleanup for expired tokens
    // For MongoDB: await this.blacklistModel.deleteMany({ expiresAt: { $lt: new Date() } });
  }
}

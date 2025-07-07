import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user/user.repository';
import { User } from './user/user.entity';

@Injectable()
export class AppService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserProfile(userId: string): Promise<User | null> {
    const userIdNumber = parseInt(userId, 10);
    
    if (isNaN(userIdNumber)) {
      throw new NotFoundException('Invalid user ID format');
    }

    const user = await this.userRepository.findById(userIdNumber);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return user without password for security
    const { password, ...userProfile } = user;
    return userProfile as User;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await this.userRepository.findByUsername(username);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return user without password for security
    const { password, ...userProfile } = user;
    return userProfile as User;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.userRepository.findAll();
    
    // Return users without passwords for security
    return users.map(user => {
      const { password, ...userProfile } = user;
      return userProfile as User;
    });
  }
}

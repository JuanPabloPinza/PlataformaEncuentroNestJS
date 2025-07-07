import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private users = [
    {
      id: '123',
      name: 'John Doe',
    },
  ];

  getUserProfile(userId: string) {
    return this.users.find((u) => u.id === userId) || null;
  }
}

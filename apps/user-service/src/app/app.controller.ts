import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('get-user-profile')
  async getUserProfile(@Payload() userId: string) {
    return this.appService.getUserProfile(userId);
  }

  @MessagePattern('get-user-by-username')
  async getUserByUsername(@Payload() username: string) {
    return this.appService.getUserByUsername(username);
  }

  @MessagePattern('get-all-users')
  async getAllUsers() {
    return this.appService.getAllUsers();
  }
}

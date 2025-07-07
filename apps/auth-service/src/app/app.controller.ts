import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from './user/user.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('auth-login')
  async login(@Payload() credential: { username: string; password: string }) {
    return this.appService.login(credential);
  }

  @MessagePattern('auth-create-user')
  async createUser(@Payload() user: Partial<User>) {
    return this.appService.createUser(user);
  }

  @MessagePattern('validate-token')
  async validateToken(@Payload() token: string) {
    return this.appService.validateToken(token);
  }
}

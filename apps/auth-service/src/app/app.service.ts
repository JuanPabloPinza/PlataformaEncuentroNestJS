import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AppService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async login(credential: { username: string; password: string }) {
    const user = await this.userRepository.findOne({ where: { username: credential.username } });
    if (user && (await bcrypt.compare(credential.password, user.password))) {
      const payload = {
        sub: user.id,
        username: user.username,
        role: user.role,
      };
      const token = this.jwtService.sign(payload);
      return { token };
    }
    throw new UnauthorizedException('Invalid Credentials');
  }

  async createUser(user: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return { valid: true, userId: decoded.sub, role: decoded.role };
    } catch (err) {
      return { valid: false, userId: null, role: null };
    }
  }
}

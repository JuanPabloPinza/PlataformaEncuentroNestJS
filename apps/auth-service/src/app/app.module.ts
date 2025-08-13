import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', // change as needed
      password: 'alex', // change as needed
      database: 'auth_db',  // change as needed
      entities: [User],
      synchronize: true, // set to false in production
    }),
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: 'your_jwt_secret',
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

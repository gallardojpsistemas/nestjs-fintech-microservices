import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';
import { HttpModule } from '@nestjs/axios';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    HttpModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('JWT_EXPIRES_IN') as StringValue,
        },
      }),
    }),
    RabbitMQModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard]
})
export class AuthModule { }

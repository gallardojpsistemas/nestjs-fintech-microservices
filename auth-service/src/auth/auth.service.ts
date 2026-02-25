import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { serviceCall } from '../common/service-call-util';

@Injectable()
export class AuthService {
    private readonly services: Record<string, string>;

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {
        this.services = JSON.parse(
            this.configService.getOrThrow<string>('SERVICES'),
        ) as Record<string, string>;
    }

    async login(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);

        if (!user)
            throw new UnauthorizedException('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch)
            throw new UnauthorizedException('Invalid credentials');

        const payload = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async register(email: string, password: string) {
        const existingUser = await this.usersService.findByEmail(email);

        if (existingUser)
            throw new BadRequestException('User already exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await this.usersService.create(email, hashedPassword);

        await this.createWallet(user._id.toString());

        return {
            id: user._id.toString(),
            email: user.email,
        };
    }

    private async createWallet(userId: string): Promise<void> {
        await serviceCall(this.services, {
            service: 'wallet',
            method: 'POST',
            path: `/wallet/${userId}`,
        });
    }
}

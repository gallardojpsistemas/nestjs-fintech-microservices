import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req: Request & { user: JwtPayload }) {
        return req.user;
    }

    @Post('login')
    async login(@Body() body: RegisterDto) {
        return this.authService.login(body.email, body.password);
    }

    @Post('register')
    async register(@Body() body: RegisterDto) {
        return await this.authService.register(body.email, body.password);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('admin')
    getAdminData() {
        return { message: 'Admin only route' };
    }
}

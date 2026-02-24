import { Body, Controller, Post } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() body: RegisterDto) {
        return this.authService.login(body.email, body.password);
    }

    @Post('register')
    async register(@Body() body: RegisterDto) {
        return await this.authService.register(body.email, body.password);
    }
}

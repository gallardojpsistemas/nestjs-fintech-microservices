import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiExcludeEndpoint } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Return the profile of the currently logged-in user.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @Get('me')
    getProfile(@Request() req: Request & { user: JwtPayload }) {
        return req.user;
    }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 201, description: 'User successfully logged in, returns JWT token.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    async login(@Body() body: LoginDto) {
        return this.authService.login(body.email, body.password);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: 201, description: 'User successfully registered.' })
    @ApiResponse({ status: 400, description: 'Bad Request (e.g., email already exists).' })
    async register(@Body() body: RegisterDto) {
        return await this.authService.register(body.email, body.password);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @ApiBearerAuth()
    @Roles('ADMIN')
    @Get('admin')
    @ApiOperation({ summary: 'Get admin-only data' })
    @ApiResponse({ status: 200, description: 'Return admin data.' })
    @ApiResponse({ status: 403, description: 'Forbidden. Requires ADMIN role.' })
    getAdminData() {
        return { message: 'Admin only route' };
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('users')
    @ApiOperation({ summary: 'Get all users' })
    @ApiResponse({ status: 200, description: 'Return a list of all users.' })
    async getAllUsers() {
        return await this.authService.getAllUsers();
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiExcludeEndpoint()
    @Post('logout')
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({ status: 201, description: 'User successfully logged out.' })
    async logout() {
        return { message: 'Logged out successfully' };
    }
}

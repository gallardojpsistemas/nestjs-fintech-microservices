import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WalletClient {
    private readonly baseUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        this.baseUrl = this.configService.getOrThrow<string>('WALLET_SERVICE_URL');
    }

    async createWallet(userId: string) {
        await firstValueFrom(
            this.httpService.post(`${this.baseUrl}/wallet/${userId}`),
        );
    }
}
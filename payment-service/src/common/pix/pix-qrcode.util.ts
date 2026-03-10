import QRCode from 'qrcode'
import { generatePixPayload } from './pix-payload.util'

export async function generatePixQr(
    pixKey: string,
    merchantName: string,
    merchantCity: string,
    amount: number,
    txId: string,
) {
    const payload = generatePixPayload(
        pixKey,
        merchantName,
        merchantCity,
        amount,
        txId,
    )

    const qrCode = await QRCode.toDataURL(payload)

    return {
        payload,
        qrCode,
    }
}
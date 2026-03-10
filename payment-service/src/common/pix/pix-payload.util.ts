function format(id: string, value: string) {
    const size = value.length.toString().padStart(2, '0')
    return id + size + value
}

export function generatePixPayload(
    pixKey: string,
    merchantName: string,
    merchantCity: string,
    amount: number,
    txId: string,
) {
    const payload =
        format('00', '01') +
        format(
            '26',
            format('00', 'BR.GOV.BCB.PIX') +
            format('01', pixKey),
        ) +
        format('52', '0000') +
        format('53', '986') +
        format('54', amount.toFixed(2)) +
        format('58', 'BR') +
        format('59', merchantName.substring(0, 25)) +
        format('60', merchantCity.substring(0, 15)) +
        format(
            '62',
            format('05', txId),
        )

    return payload
}
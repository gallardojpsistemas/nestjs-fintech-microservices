import axios, { Method } from 'axios';

interface ServiceCallOptions {
    service: string;
    method: Method;
    path: string;
    data?: any;
    headers?: Record<string, string>;
}

export async function serviceCall<T>(
    services: Record<string, string>,
    options: ServiceCallOptions,
): Promise<T> {
    const baseUrl = services[options.service];

    if (!baseUrl) {
        throw new Error(`Service ${options.service} not configured`);
    }

    const url = `${baseUrl}${options.path}`;

    const response = await axios.request<T>({
        method: options.method,
        url,
        data: options.data,
        headers: options.headers,
    });

    return response.data;
}
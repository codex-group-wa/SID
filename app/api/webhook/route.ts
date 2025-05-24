"use server"

import { clone } from '@/lib/process'
import crypto from 'crypto'

export async function POST(request: Request) {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
        return new Response("Webhook secret not configured", { status: 500 });
    }

    // Get raw body as buffer for signature validation
    const rawBody = await request.arrayBuffer();
    const bodyBuffer = Buffer.from(rawBody);

    // Get signature headers
    const sig256 = request.headers.get('x-hub-signature-256');
    const sig1 = request.headers.get('x-hub-signature');

    // Compute HMAC digests
    const hmac256 = 'sha256=' + crypto.createHmac('sha256', secret).update(bodyBuffer).digest('hex');
    const hmac1 = 'sha1=' + crypto.createHmac('sha1', secret).update(bodyBuffer).digest('hex');

    // Validate signatures
    const valid =
        (sig256 && crypto.timingSafeEqual(Buffer.from(sig256), Buffer.from(hmac256))) ||
        (sig1 && crypto.timingSafeEqual(Buffer.from(sig1), Buffer.from(hmac1)));

    if (!valid) {
        return new Response("Invalid signature", { status: 401 });
    }

    // Parse JSON body after validation
    const body = JSON.parse(bodyBuffer.toString());
    console.log(body);

    const response = await clone();
    console.log(response);

    return new Response("Done", { status: 200 });
}
"use server"

import type { NextApiRequest, NextApiResponse } from 'next'
import { clone } from '@/lib/process'

type ResponseData = {
    message: string
}

export async function POST(request: Request) {
    const body = await request.json()
    console.log(body)
    //const response = await clone('REPO')
    //console.log(response)
    return new Response("Done", {
        status: 200,
    })
}
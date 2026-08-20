import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chatbot from '@/lib/models/Chatbot';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const chatbotId =
            typeof body.chatbotId === 'string'
                ? body.chatbotId.trim()
                : '';

        const message =
            typeof body.message === 'string'
                ? body.message.trim()
                : '';

        if (!chatbotId) {
            return NextResponse.json(
                { error: 'Chatbot ID is required.' },
                { status: 400 }
            );
        }

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required.' },
                { status: 400 }
            );
        }

        await connectDB();

        const chatbot = await Chatbot.findOne({
            _id: chatbotId,
        }).lean();

        if (!chatbot) {
            return NextResponse.json(
                { error: 'Chatbot not found.' },
                { status: 404 }
            );
        }

        /*
         * TEMPORARY TEST RESPONSE
         *
         * This confirms that the widget -> API -> database
         * connection is working.
         *
         * We will connect your actual AI provider after
         * this test works.
         */
        return NextResponse.json({
            answer: `You asked: "${message}". Your chatbot "${chatbot.name}" is working successfully!`,
        });
    } catch (error) {
        console.error('[api/chat] error:', error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to process chat.',
            },
            { status: 500 }
        );
    }
}
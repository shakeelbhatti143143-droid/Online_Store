export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chatbot from '@/lib/models/Chatbot';
import AllowedDomain from '@/lib/models/AllowedDomain';

export async function GET() {
    try {
        await connectDB();

        const allowedDomains = await AllowedDomain.find({
            domain: 'http://localhost:3000',
            isEnabled: true,
        })
            .sort({ createdAt: -1 })
            .lean();

        if (!allowedDomains.length) {
            return NextResponse.json({
                success: true,
                chatbot: null,
            });
        }

        for (const allowedDomain of allowedDomains) {
            const chatbot = await Chatbot.findOne({
                _id: allowedDomain.chatbotId,
                status: 'active',
                isDeleted: false,
            }).lean();

            if (!chatbot) {
                continue;
            }

            return NextResponse.json({
                success: true,
                chatbot: {
                    id: String(chatbot._id),
                    _id: String(chatbot._id),
                    publicId: chatbot.publicId,
                    name: chatbot.name,
                    description: chatbot.description || '',
                    status: chatbot.status,

                    appearance: {
                        title:
                            chatbot.appearance?.title ||
                            chatbot.name,

                        subtitle:
                            chatbot.appearance?.subtitle || '',

                        logoUrl:
                            chatbot.appearance?.logoUrl || '',

                        avatarUrl:
                            chatbot.appearance?.avatarUrl || '',

                        primaryColor:
                            chatbot.appearance?.primaryColor ||
                            '#2563EB',

                        secondaryColor:
                            chatbot.appearance?.secondaryColor ||
                            '#1E40AF',

                        textColor:
                            chatbot.appearance?.textColor ||
                            '#1F2937',

                        backgroundColor:
                            chatbot.appearance?.backgroundColor ||
                            '#FFFFFF',

                        userMessageColor:
                            chatbot.appearance?.userMessageColor ||
                            '#2563EB',

                        botMessageColor:
                            chatbot.appearance?.botMessageColor ||
                            '#F3F4F6',

                        borderRadius:
                            chatbot.appearance?.borderRadius ?? 12,

                        fontSize:
                            chatbot.appearance?.fontSize ?? 14,

                        position:
                            chatbot.appearance?.position ||
                            'bottom-right',

                        buttonIcon:
                            chatbot.appearance?.buttonIcon ||
                            'chat',

                        buttonSize:
                            chatbot.appearance?.buttonSize ?? 58,

                        welcomeMessage:
                            chatbot.appearance?.welcomeMessage ||
                            'Hello! How can I help you today?',

                        placeholderText:
                            chatbot.appearance?.placeholderText ||
                            'Type your message...',

                        showBranding:
                            chatbot.appearance?.showBranding ??
                            true,

                        customCss:
                            chatbot.appearance?.customCss || '',
                    },
                },
            });
        }

        return NextResponse.json({
            success: true,
            chatbot: null,
        });
    } catch (error) {
        console.error(
            '[public/chatbot] GET error:',
            error
        );

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to load public chatbot.',
            },
            {
                status: 500,
            }
        );
    }
}
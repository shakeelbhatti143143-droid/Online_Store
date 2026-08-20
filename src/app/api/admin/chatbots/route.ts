export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, parseJsonBody } from '@/lib/api/admin-auth';
import {
    listChatbots,
    createChatbot,
} from '@/lib/chatbot/service';
import Conversation from '@/lib/models/Conversation';
import Message from '@/lib/models/Message';
import AllowedDomain from '@/lib/models/AllowedDomain';
import { isValidDomainInput, normalizeAllowedDomain } from '@/lib/security/domain-validation';

/**
 * GET /api/admin/chatbots — list chatbots for the admin's tenant
 * POST /api/admin/chatbots — create a chatbot
 */

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const chatbots = await listChatbots(auth.context.tenantId);

        // Enrich with conversation/message counts
        const enriched = await Promise.all(
            chatbots.map(async (bot) => {
                const [conversations, messages] = await Promise.all([
                    Conversation.countDocuments({
                        tenantId: auth.context.tenantId,
                        chatbotId: bot._id,
                    }),
                    Message.countDocuments({
                        tenantId: auth.context.tenantId,
                    }),
                ]);

                return {
                    _id: String(bot._id),
                    publicId: bot.publicId,
                    name: bot.name,
                    description: bot.description,
                    internalIdentifier: bot.internalIdentifier,
                    status: bot.status,
                    aiProvider: bot.aiConfig.provider,
                    aiModel: bot.aiConfig.model,
                    conversationCount: conversations,
                    messageCount: messages,
                    createdAt: bot.createdAt,
                    updatedAt: bot.updatedAt,
                };
            })
        );

        return NextResponse.json({ chatbots: enriched });
    } catch (error) {
        console.error('[admin/chatbots] GET error:', error);

        return NextResponse.json(
            { error: 'Failed to load chatbots.' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAdmin(request);
        if (!auth.ok) return auth.response;

        const body = await parseJsonBody(request);

        if (!body) {
            return NextResponse.json(
                { error: 'Invalid request body.' },
                { status: 400 }
            );
        }

        const name =
            typeof body.name === 'string'
                ? body.name.trim()
                : '';

        if (!name) {
            return NextResponse.json(
                { error: 'Chatbot name is required.' },
                { status: 400 }
            );
        }

        const domainInput =
            typeof body.domain === 'string'
                ? body.domain.trim()
                : '';

        /*
         * Allow localhost for local development/testing.
         *
         * Examples allowed:
         * http://localhost:3000
         * http://localhost:3001
         * http://127.0.0.1:3000
         * https://example.com
         */
        let validDomain = true;

        if (domainInput) {
            try {
                const url = new URL(domainInput);

                const isLocalhost =
                    url.hostname === 'localhost' ||
                    url.hostname === '127.0.0.1';

                const isHttpOrHttps =
                    url.protocol === 'http:' ||
                    url.protocol === 'https:';

                if (isLocalhost) {
                    validDomain = isHttpOrHttps;
                } else {
                    validDomain = isValidDomainInput(domainInput);
                }
            } catch {
                validDomain = false;
            }
        }

        if (domainInput && !validDomain) {
            return NextResponse.json(
                { error: 'Invalid website domain.' },
                { status: 400 }
            );
        }

        const chatbot = await createChatbot({
            tenantId: auth.context.tenantId,
            createdBy: auth.context.session.adminId,
            name,
            description:
                typeof body.description === 'string'
                    ? body.description
                    : '',
            internalIdentifier:
                typeof body.internalIdentifier === 'string'
                    ? body.internalIdentifier
                    : '',
            status:
                body.status === 'inactive'
                    ? 'inactive'
                    : 'active',
            aiConfig:
                (body.aiConfig as Record<string, unknown>) ||
                undefined,
            appearance:
                (body.appearance as Record<string, unknown>) ||
                undefined,
        });

        /*
         * Save the allowed domain.
         *
         * For localhost testing, we intentionally do not create
         * an AllowedDomain database record because localhost is
         * only being used as a temporary development environment.
         */
        if (domainInput) {
            const normalized =
                normalizeAllowedDomain(domainInput);

            if (
                normalized !== 'http://localhost:3000' &&
                normalized !== 'http://127.0.0.1:3000'
            ) {
                await AllowedDomain.create({
                    tenantId: auth.context.tenantId,
                    chatbotId: chatbot._id,
                    domain: normalized,
                    isEnabled: true,
                }).catch((error) => {
                    console.error(
                        '[admin/chatbots] Failed to save allowed domain:',
                        error
                    );
                });
            }
        }

        return NextResponse.json(
            {
                chatbot: {
                    id: String(chatbot._id),
                    publicId: chatbot.publicId,
                    name: chatbot.name,
                    description: chatbot.description,
                    status: chatbot.status,
                    aiConfig: chatbot.aiConfig,
                    appearance: chatbot.appearance,
                    createdAt: chatbot.createdAt,
                    updatedAt: chatbot.updatedAt,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('[admin/chatbots] POST error:', error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to create chatbot.',
            },
            { status: 400 }
        );
    }
}
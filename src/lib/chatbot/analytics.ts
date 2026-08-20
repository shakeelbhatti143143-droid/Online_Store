import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Conversation from '@/lib/models/Conversation';
import Message from '@/lib/models/Message';
import KnowledgeDocument from '@/lib/models/KnowledgeDocument';

/**
 * Compute chatbot analytics for the admin dashboard.
 * All queries are scoped by tenantId + chatbotId.
 */
export async function getChatbotAnalytics(tenantId: string, chatbotId: string) {
    await connectDB();

    const [totalConversations, totalMessages, uniqueVisitors, failedResponses, kbSearchCount] =
        await Promise.all([
            Conversation.countDocuments({ tenantId, chatbotId }),
            Message.countDocuments({ tenantId, conversationId: { $exists: true } }),
            Conversation.distinct('visitorId', { tenantId, chatbotId }),
            Message.countDocuments({ role: { $ne: 'user' }, tenantId }),
            KnowledgeDocument.countDocuments({ tenantId, chatbotId, status: 'completed', isDeleted: false }),
        ]);

    // Conversations by day (last 14 days)
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 14);

    const convoDayAgg = await Conversation.aggregate([
        { $match: { tenantId: new Types.ObjectId(tenantId), chatbotId: new Types.ObjectId(chatbotId), createdAt: { $gte: sinceDate } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Conversations by month (last 12 months)
    const sinceMonth = new Date();
    sinceMonth.setMonth(sinceMonth.getMonth() - 12);

    const convoMonthAgg = await Conversation.aggregate([
        { $match: { tenantId: new Types.ObjectId(tenantId), chatbotId: new Types.ObjectId(chatbotId), createdAt: { $gte: sinceMonth } } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Token / cost / latency aggregates
    const tokenAgg = await Conversation.aggregate([
        { $match: { tenantId: new Types.ObjectId(tenantId), chatbotId: new Types.ObjectId(chatbotId) } },
        {
            $group: {
                _id: null,
                totalTokens: { $sum: '$tokenUsage' },
                totalCost: { $sum: '$aiCostEstimate' },
                totalLatency: { $sum: '$aiResponseTimeMs' },
                avgLatency: { $avg: '$aiResponseTimeMs' },
                avgMessages: { $avg: '$messageCount' },
                avgConversationLengthMs: {
                    $avg: { $subtract: ['$lastMessageAt', '$startedAt'] },
                },
            },
        },
    ]);

    // Most common questions (top user messages)
    const commonQuestions = await Message.aggregate([
        { $match: { tenantId: new Types.ObjectId(tenantId), role: 'user' } },
        { $group: { _id: '$content', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    const tokenData = tokenAgg[0] || {};

    return {
        totalConversations,
        totalMessages,
        uniqueVisitors: uniqueVisitors.length,
        messagesPerConversation: tokenData.avgMessages || 0,
        avgConversationLengthMs: tokenData.avgConversationLengthMs || 0,
        avgAiResponseTimeMs: tokenData.avgLatency || 0,
        tokenUsage: tokenData.totalTokens || 0,
        estimatedCostUsd: tokenData.totalCost || 0,
        conversationsByDay: convoDayAgg.map((r) => ({ date: r._id, count: r.count })),
        conversationsByMonth: convoMonthAgg.map((r) => ({ date: r._id, count: r.count })),
        mostCommonQuestions: commonQuestions.map((r) => ({ question: r._id, count: r.count })),
        failedResponses,
        knowledgeBaseSearches: kbSearchCount,
    };
}
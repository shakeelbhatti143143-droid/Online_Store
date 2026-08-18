'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Boxes,
  Package,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AIChatMessage } from '@/types';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';

export default function AdminAssistantPage() {
  const { showToast } = useToast();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      content:
        'Welcome to the Director AI Workspace. I monitor your inventory health, analyze revenue streams, and can directly modify catalog valuations or manage order fulfillment pipelines on your instruction.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    const prompt = text.trim();
    if (!prompt) return;

    const userMsg: AIChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(async () => {
      const lower = prompt.toLowerCase();
      const products = await storeDb.getProducts();
      const orders = await storeDb.getOrders();
      const analytics = await storeDb.getAnalytics();

      let reply = '';
      let actionReq: AIChatMessage['actionRequired'] | undefined = undefined;

      if (lower.includes('revenue') || lower.includes('sales')) {
        reply = `📊 Total revenue: ${formatPrice(analytics.totalRevenue)} (+${analytics.revenueChangePct}% vs previous cycle). Total processed orders: ${analytics.totalOrders}.`;
      } else if (lower.includes('low') || lower.includes('stock') || lower.includes('inventory')) {
        const lowStock = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
        if (lowStock.length > 0) {
          const list = lowStock.map((p) => `• ${p.title}: ${p.stockQuantity} units left (threshold: ${p.lowStockThreshold})`).join('\n');
          reply = `⚠️ Inventory Alert: There are ${lowStock.length} pieces near exhaustion:\n\n${list}\n\nWould you like me to adjust stock or trigger a restock order?`;
        } else {
          reply = '✅ All inventory levels are above minimum safety thresholds.';
        }
      } else if (lower.includes('top') || lower.includes('best')) {
        const top = products.filter((p) => p.isBestSeller || p.badge === 'BEST SELLER').slice(0, 4);
        const list = top.map((p, i) => `${i + 1}. ${p.title} (${formatPrice(p.price)})`).join('\n');
        reply = `🏆 Leading best sellers this month:\n\n${list}`;
      } else if (lower.includes('delete')) {
        const targetProd = products[0];
        actionReq = {
          actionType: 'DELETE_PRODUCT',
          title: `Delete Product "${targetProd?.title}"`,
          description: `You are requesting permanent deletion of product ${targetProd?.sku}. This will purge it from the live catalog and invalidate Redis cache keys.`,
          payload: { productId: targetProd?.id, title: targetProd?.title },
        };
        reply = `⚠️ Destructive Action Requested: You are about to delete "${targetProd?.title}". Please confirm below before I execute the deletion.`;
      } else if (lower.includes('price')) {
        const targetProd = products[0];
        const newPrice = 1999;
        actionReq = {
          actionType: 'UPDATE_PRICE',
          title: `Update Price for "${targetProd?.title}"`,
          description: `Change price from ${formatPrice(targetProd?.price)} to ${formatPrice(newPrice)}.`,
          payload: { productId: targetProd?.id, newPrice },
        };
        reply = `⚠️ Price Modification: Please review and confirm updating the price of "${targetProd?.title}" to ${formatPrice(newPrice)}.`;
      } else if (lower.includes('cancel')) {
        const targetOrder = orders[0];
        actionReq = {
          actionType: 'CANCEL_ORDER',
          title: `Cancel Order "${targetOrder?.orderNumber}"`,
          description: `Cancel order for ${targetOrder?.customerName} (${formatPrice(targetOrder?.totalAmount)}) and update status to Cancelled.`,
          payload: { orderId: targetOrder?.id },
        };
        reply = `⚠️ Order Cancellation: You are about to cancel order ${targetOrder?.orderNumber}. Please confirm to proceed.`;
      } else {
        reply = `I have received: "${prompt}". Redis caching layer and PostgreSQL database are synchronized. You can ask for real-time telemetry, stock reordering, or product price modifications.`;
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
          actionRequired: actionReq,
        },
      ]);
    }, 600);
  };

  const handleConfirmAction = async (action: AIChatMessage['actionRequired']) => {
    if (!action) return;

    if (action.actionType === 'DELETE_PRODUCT') {
      await storeDb.deleteProduct(action.payload.productId);
      showToast({ type: 'success', title: 'Product Deleted', message: `Deleted ${action.payload.title}` });
    } else if (action.actionType === 'UPDATE_PRICE') {
      await storeDb.updateProduct(action.payload.productId, { price: action.payload.newPrice });
      showToast({ type: 'success', title: 'Price Updated', message: `Valuation adjusted to ${formatPrice(action.payload.newPrice)}` });
    } else if (action.actionType === 'CANCEL_ORDER') {
      await storeDb.updateOrderStatus(action.payload.orderId, 'cancelled');
      showToast({ type: 'info', title: 'Order Cancelled', message: 'Order status updated to Cancelled.' });
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        content: `✅ Action confirmed and executed: ${action.title}. Redis cache has been automatically invalidated.`,
        timestamp: new Date().toISOString(),
        actionConfirmed: true,
      },
    ]);
  };

  return (
    <div className="h-[82vh] flex flex-col rounded-3xl glass-panel border border-border-light bg-surface-200/90 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-6 border-b border-border-light flex items-center justify-between bg-surface-100/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-surface-300 rounded-[14px] flex items-center justify-center text-cyan-300">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
              <span>Director AI Operations Workspace</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                ACTIVE
              </span>
            </h2>
            <p className="text-xs text-gray-400">Natural Language Database & Store Automation</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Safety Guardrails Engaged</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gold-500 text-black font-semibold rounded-br-none shadow-lg shadow-gold-500/15'
                  : 'bg-surface-100 text-gray-200 border border-border-light rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>

              {msg.actionRequired && !msg.actionConfirmed && (
                <div className="mt-4 p-4 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-300 text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Safety Confirmation Guardrail</span>
                  </div>
                  <p className="text-xs leading-normal">{msg.actionRequired.description}</p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: `cancel-${Date.now()}`,
                            sender: 'assistant',
                            content: 'Action cancelled. No database changes were made.',
                            timestamp: new Date().toISOString(),
                          },
                        ])
                      }
                    >
                      Cancel Action
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleConfirmAction(msg.actionRequired)}
                    >
                      Confirm & Execute
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-500 mt-1 font-mono">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-surface-100/60 border border-white/5 w-24">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce delay-100" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce delay-200" />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form & Suggestion Chips */}
      <div className="p-4 sm:p-6 border-t border-border-light bg-surface-100/70 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            'What is our total revenue and sales?',
            'Which products are low in stock?',
            'Show top selling products',
            'How many orders are pending shipment?',
          ].map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 rounded-xl bg-surface-200 hover:bg-surface-50 text-xs text-gray-300 hover:text-white border border-white/5 shrink-0 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            placeholder="Ask AI Director about sales metrics, low stock warnings, or execute actions..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-surface-200 text-white placeholder-gray-500 border border-border-light rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-cyan-500"
          />
          <Button
            type="submit"
            variant="gold"
            size="md"
            disabled={!input.trim()}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Ask AI
          </Button>
        </form>
      </div>
    </div>
  );
}

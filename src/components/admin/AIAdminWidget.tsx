'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  DollarSign,
  TrendingUp,
  Package,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { AIChatMessage, Product, Order } from '@/types';
import { storeApi as storeDb } from '@/lib/api/store-client';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';

export interface AIAdminWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AIAdminWidget: React.FC<AIAdminWidgetProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (controlledOnClose && !open) controlledOnClose();
    setInternalIsOpen(open);
  };

  const { showToast } = useToast();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAction, setPendingAction] = useState<AIChatMessage['actionRequired'] | null>(null);

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      content:
        'Greetings, Director. I am your autonomous AI Store Assistant. You can ask me to analyze revenue, check low stock inventory, query best-sellers, modify pricing, or create new catalog pieces.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    'What is our total revenue and sales?',
    'Which products are low in stock?',
    'Show top selling products',
    'How many orders are pending shipment?',
  ];

  const handleSendMessage = async (text: string) => {
    const promptText = text.trim();
    if (!promptText) return;

    const userMsg: AIChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: promptText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Natural Language Processing Logic
    setTimeout(async () => {
      const lower = promptText.toLowerCase();
      const products = await storeDb.getProducts();
      const orders = await storeDb.getOrders();
      const analytics = await storeDb.getAnalytics();

      let reply = '';
      let actionReq: AIChatMessage['actionRequired'] | undefined = undefined;

      if (lower.includes('revenue') || lower.includes('sales')) {
        reply = `📊 Total gross revenue currently stands at ${formatPrice(analytics.totalRevenue)}, reflecting a +${analytics.revenueChangePct}% increase this quarter across ${analytics.totalOrders} total processed orders.`;
      } else if (lower.includes('low') || lower.includes('stock') || lower.includes('inventory')) {
        const lowStock = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);
        if (lowStock.length > 0) {
          const list = lowStock.map((p) => `• ${p.title}: ${p.stockQuantity} units left (threshold: ${p.lowStockThreshold})`).join('\n');
          reply = `⚠️ Inventory Alert: There are ${lowStock.length} pieces near exhaustion:\n\n${list}\n\nWould you like me to adjust reorder levels or update stock?`;
        } else {
          reply = '✅ All inventory levels are healthy and above minimum safety thresholds.';
        }
      } else if (lower.includes('best') || lower.includes('top seller') || lower.includes('popular')) {
        const top = products.filter((p) => p.isBestSeller || p.badge === 'BEST SELLER').slice(0, 4);
        const list = top.map((p, i) => `${i + 1}. ${p.title} (${formatPrice(p.price)})`).join('\n');
        reply = `🏆 Our leading best-selling curations this month are:\n\n${list}`;
      } else if (lower.includes('order') || lower.includes('pending') || lower.includes('shipment')) {
        const pending = orders.filter((o) => o.status === 'pending' || o.status === 'processing');
        reply = `📦 There are currently ${pending.length} orders pending courier dispatch, totaling ${formatPrice(
          pending.reduce((acc, o) => acc + o.totalAmount, 0)
        )}. Most recent: ${pending[0]?.orderNumber || 'None'}.`;
      } else if (lower.includes('delete') && lower.includes('product')) {
        // Safety guardrail for destructive deletion
        const targetProd = products[0];
        actionReq = {
          actionType: 'DELETE_PRODUCT',
          title: `Delete Product "${targetProd?.title}"`,
          description: `You are requesting permanent deletion of product ${targetProd?.sku}. This will purge it from the live storefront and invalidate Redis cache.`,
          payload: { productId: targetProd?.id, title: targetProd?.title },
        };
        reply = `⚠️ Destructive Action Requested: You are about to delete "${targetProd?.title}". Please confirm below before I proceed with database deletion.`;
      } else if (lower.includes('price') || lower.includes('update price')) {
        // Safety guardrail for price change
        const targetProd = products[0];
        const newPrice = 1999;
        actionReq = {
          actionType: 'UPDATE_PRICE',
          title: `Update Price for "${targetProd?.title}"`,
          description: `Change price from ${formatPrice(targetProd?.price)} to ${formatPrice(newPrice)}.`,
          payload: { productId: targetProd?.id, newPrice },
        };
        reply = `⚠️ Price Modification Requested: Please review and confirm changing the valuation of "${targetProd?.title}" to ${formatPrice(newPrice)}.`;
      } else if (lower.includes('cancel order') || lower.includes('cancel')) {
        // Safety guardrail for order cancellation
        const targetOrder = orders[0];
        actionReq = {
          actionType: 'CANCEL_ORDER',
          title: `Cancel Order "${targetOrder?.orderNumber}"`,
          description: `Cancel order for ${targetOrder?.customerName} (${formatPrice(targetOrder?.totalAmount)}) and initiate refund.`,
          payload: { orderId: targetOrder?.id },
        };
        reply = `⚠️ Order Cancellation: You are about to cancel order ${targetOrder?.orderNumber}. Please confirm to proceed.`;
      } else {
        reply = `I have analyzed your request: "${promptText}". All systems are synchronized across Redis and PostgreSQL. You can ask for real-time sales summaries, stock alerts, or catalog modifications.`;
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
      if (actionReq) {
        setPendingAction(actionReq);
      }
    }, 700);
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

    setPendingAction(null);
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
    <>
      {/* Floating Trigger Button on Admin screens */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all group"
        aria-label="Open AI Assistant"
      >
        <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-surface-300 animate-pulse" />
      </button>

      {/* Slide-over / Modal Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-md bg-surface-200 border-l border-border-light shadow-2xl flex flex-col justify-between z-10"
            >
              {/* Chat Header */}
              <div className="p-5 border-b border-border-light flex items-center justify-between bg-surface-100/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 shadow-lg">
                    <div className="w-full h-full bg-surface-300 rounded-[10px] flex items-center justify-center text-cyan-300">
                      <Bot className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Director AI Agent</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        ONLINE
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-400">Autonomous Operations Engine</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gold-500 text-black font-semibold rounded-br-none shadow-md shadow-gold-500/15'
                          : 'bg-surface-100/90 text-gray-200 border border-border-light rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>

                      {/* Destructive Action Confirmation Card */}
                      {msg.actionRequired && !msg.actionConfirmed && (
                        <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 space-y-2">
                          <div className="flex items-center gap-1.5 font-bold text-rose-300">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Confirmation Required</span>
                          </div>
                          <p className="text-[11px] leading-normal">{msg.actionRequired.description}</p>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => setPendingAction(null)}
                              className="px-2.5 py-1 rounded-lg bg-surface-100 hover:bg-surface-50 text-gray-300 text-[10px] font-semibold border border-white/10"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleConfirmAction(msg.actionRequired)}
                              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold shadow-md shadow-rose-600/30"
                            >
                              Confirm & Execute
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-500 mt-1 font-mono">
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

              {/* Quick Prompts & Chat Input */}
              <div className="p-4 border-t border-border-light bg-surface-100/60 space-y-3">
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(qp)}
                      className="px-2.5 py-1 rounded-lg bg-surface-200 hover:bg-surface-100 text-[11px] text-gray-400 hover:text-white border border-white/5 shrink-0 transition-colors"
                    >
                      {qp}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(input);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ask about revenue, stock, or modify items..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-surface-200 text-white placeholder-gray-500 border border-border-light rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:brightness-110 text-white disabled:opacity-40 transition-all shadow-md shadow-cyan-500/20"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

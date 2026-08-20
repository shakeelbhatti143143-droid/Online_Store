"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateChatbotPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("http://localhost:3000");
  const [model, setModel] = useState("gemini-3.1-flash-lite");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful AI assistant. Answer questions clearly, accurately, and professionally."
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hello! How can I help you today?"
  );
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [position, setPosition] = useState("bottom-right");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Please enter a chatbot name.");
      return;
    }

    if (!systemPrompt.trim()) {
      setError("Please enter a system prompt.");
      return;
    }

    const domainToSubmit = domain.trim() || "localhost:3000";

    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        domain: domainToSubmit,
        aiConfig: {
          provider: "gemini",
          model: "gemini-3.1-flash-lite",
          systemPrompt: systemPrompt.trim(),
          welcomeMessage: welcomeMessage.trim(),
        },
        appearance: {
          title: name.trim(),
          primaryColor,
          position,
          welcomeMessage: welcomeMessage.trim(),
        },
      };

      const response = await fetch("/api/admin/chatbots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to create the chatbot.");
      }

      setMessage("Chatbot created successfully. Opening its configuration...");
      router.push(`/admin/chatbots/${data.chatbot.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/admin/chatbots")}
            className="mb-4 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Back to Chatbots
          </button>

          <h1 className="text-3xl font-bold text-gray-900">
            Create AI Chatbot
          </h1>

          <p className="mt-2 text-gray-600">
            Create and configure a new AI chatbot for your website.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic Information */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  Basic Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Give your chatbot a name and description.
                </p>

                <div className="mt-6 space-y-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Chatbot Name *
                    </label>

                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Customer Support Bot"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>

                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="AI assistant for customer support."
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="domain" className="mb-2 block text-sm font-medium text-gray-700">
                      Website Domain
                    </label>
                    <input
                      id="domain"
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="http://localhost:3000 or shop.example.com"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Testing domain <span className="font-semibold text-blue-600">http://localhost:3000</span> is automatically added for immediate local testing.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Configuration */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  AI Configuration
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Configure how your AI chatbot behaves.
                </p>

                <div className="mt-6 space-y-5">
                  {/* Model */}
                  <div>
                    <label
                      htmlFor="model"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      AI Model
                    </label>

                    <select
                      id="model"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="gemini-3.1-flash-lite">
                        Gemini 3.1 Flash-Lite
                      </option>
                    </select>
                  </div>

                  {/* System Prompt */}
                  <div>
                    <label
                      htmlFor="systemPrompt"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      System Prompt *
                    </label>

                    <textarea
                      id="systemPrompt"
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={8}
                      placeholder="Tell the AI how it should behave..."
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <p className="mt-2 text-xs text-gray-500">
                      Example: You are a helpful customer support assistant.
                    </p>
                  </div>

                  {/* Welcome Message */}
                  <div>
                    <label
                      htmlFor="welcomeMessage"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Welcome Message
                    </label>

                    <textarea
                      id="welcomeMessage"
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      rows={3}
                      placeholder="Hello! How can I help you?"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  Appearance
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Customize how your chatbot widget looks.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Color */}
                  <div>
                    <label
                      htmlFor="primaryColor"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Primary Color
                    </label>

                    <div className="flex gap-3">
                      <input
                        id="primaryColor"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-12 w-16 cursor-pointer rounded border"
                      />

                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-3"
                      />
                    </div>
                  </div>

                  {/* Position */}
                  <div>
                    <label
                      htmlFor="position"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Widget Position
                    </label>

                    <select
                      id="position"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  {message}
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/admin/chatbots")}
                  className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Chatbot"}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  Preview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Preview your chatbot widget.
                </p>

                <div className="mt-6 overflow-hidden rounded-xl border bg-gray-100">
                  {/* Chat Header */}
                  <div
                    className="p-4 text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="font-semibold">
                      {name || "My AI Chatbot"}
                    </div>

                    <div className="mt-1 text-xs opacity-80">
                      AI Assistant
                    </div>
                  </div>

                  {/* Chat Content */}
                  <div className="min-h-[280px] space-y-4 bg-white p-4">
                    <div className="flex">
                      <div className="max-w-[85%] rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
                        {welcomeMessage ||
                          "Hello! How can I help you today?"}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div
                        className="max-w-[85%] rounded-lg p-3 text-sm text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        I have a question.
                      </div>
                    </div>

                    <div className="flex">
                      <div className="max-w-[85%] rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
                        Sure! Ask me anything.
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="border-t bg-white p-3">
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-lg border px-3 py-2 text-xs text-gray-400">
                        Type your message...
                      </div>

                      <button
                        type="button"
                        className="rounded-lg px-3 py-2 text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Widget Button */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Widget
                  </span>


                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

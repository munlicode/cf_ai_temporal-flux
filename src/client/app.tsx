/** biome-ignore-all lint/correctness/useUniqueElementIds: it's alright */
import { useEffect, useState, useRef, useCallback } from "react";
import { useAgent } from "agents/react";
import { isStaticToolUIPart } from "ai";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import type { UIMessage } from "@ai-sdk/react";
import type { tools } from "./tools";
import type { FluxState } from "../shared";

// Component imports
import { Button } from "@/components/button/Button";
import { VoiceInput } from "@/components/voice-input/VoiceInput";
import { Card } from "@/components/card/Card";
import { Avatar } from "@/components/avatar/Avatar";
import { Toggle } from "@/components/toggle/Toggle";
import { Textarea } from "@/components/textarea/Textarea";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ToolInvocationCard } from "@/components/tool-invocation-card/ToolInvocationCard";
import { StreamView } from "@/components/stream/StreamView";
import { SidebarIcon } from "lucide-react";

// Icon imports
import {
	BugIcon,
	MoonIcon,
	RobotIcon,
	SunIcon,
	TrashIcon,
	PaperPlaneTiltIcon,
	StopIcon,
} from "@phosphor-icons/react";

// List of tools that require human confirmation
// NOTE: this should match the tools that don't have execute functions in tools.ts
const toolsRequiringConfirmation: (keyof typeof tools)[] = [
	"getWeatherInformation",
];

export default function App() {
	const [theme, setTheme] = useState<"dark" | "light">(() => {
		// Check localStorage first, default to dark if not found
		const savedTheme = localStorage.getItem("theme");
		return (savedTheme as "dark" | "light") || "light";
	});
	const [showDebug, setShowDebug] = useState(false);
	const [textareaHeight, setTextareaHeight] = useState("auto");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Flux State
	const [fluxState, setFluxState] = useState<FluxState>({
		stream: [],
		events: [],
	});

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		// Apply theme class on mount and when theme changes
		if (theme === "dark") {
			document.documentElement.classList.add("dark");
			document.documentElement.classList.remove("light");
		} else {
			document.documentElement.classList.remove("dark");
			document.documentElement.classList.add("light");
		}

		// Save theme preference to localStorage
		localStorage.setItem("theme", theme);
	}, [theme]);

	// Scroll to bottom on mount
	useEffect(() => {
		scrollToBottom();
	}, [scrollToBottom]);

	const toggleTheme = () => {
		const newTheme = theme === "dark" ? "light" : "dark";
		setTheme(newTheme);
	};

	const agent = useAgent<FluxState>({
		agent: "chat",
		onStateUpdate: (newState) => {
			// Merge with initial state structure to prevent bugs if partial state is sent
			setFluxState((prev) => ({
				...prev,
				...newState,
			}));
		},
	});

	const [agentInput, setAgentInput] = useState("");
	const handleAgentInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		setAgentInput(e.target.value);
	};

	const handleAgentSubmit = async (
		e: React.FormEvent,
		extraData: Record<string, unknown> = {},
	) => {
		e.preventDefault();
		if (!agentInput.trim()) return;

		const message = agentInput;
		setAgentInput("");

		// Send message to agent
		await sendMessage(
			{
				role: "user",
				parts: [{ type: "text", text: message }],
			},
			{
				body: extraData,
			},
		);
	};

	const {
		messages: agentMessages,
		addToolResult,
		clearHistory,
		status,
		sendMessage,
		stop,
	} = useAgentChat<FluxState, UIMessage<{ createdAt: string }>>({
		agent,
	});

	// Scroll to bottom when messages change
	useEffect(() => {
		agentMessages.length > 0 && scrollToBottom();
	}, [agentMessages, scrollToBottom]);

	const pendingToolCallConfirmation = agentMessages.some((m: UIMessage) =>
		m.parts?.some(
			(part) =>
				isStaticToolUIPart(part) &&
				part.state === "input-available" &&
				// Manual check inside the component
				toolsRequiringConfirmation.includes(
					part.type.replace("tool-", "") as keyof typeof tools,
				),
		),
	);

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	// Handler for manual block deletion via UI
	const handleDeleteBlock = useCallback(
		async (id: string) => {
			await sendMessage({
				role: "user",
				parts: [{ type: "text", text: `Delete block ${id}` }],
			});
		},
		[sendMessage],
	);

	// Handler for adding a task via UI button
	const handleAddClick = useCallback(() => {
		setAgentInput("Schedule task: ");
		document.querySelector("textarea")?.focus();
	}, []);

	return (
		<div className="h-screen w-full flex flex-col bg-ob-base-200 text-ob-text-primary overflow-hidden">
			{/* Header */}
			<div className="px-6 py-3 border-b border-ob-border flex items-center justify-between bg-ob-base-100 z-20 shadow-sm h-14 shrink-0">
				<div className="flex items-center gap-4">
					<div className="flex items-center justify-center p-1 rounded-lg bg-orange-100 dark:bg-orange-900/30">
						<svg
							width="24px"
							height="24px"
							className="text-[#F48120]"
							data-icon="agents"
						>
							<use href="#ai:local:agents" />
						</svg>
					</div>
					<h1 className="font-bold text-lg tracking-tight">Flux</h1>
				</div>

				<div className="flex items-center gap-2">
					<div className="flex items-center gap-2 mr-2 px-3 py-1 bg-ob-base-200 rounded-full border border-ob-border">
						<BugIcon size={14} className="text-ob-text-secondary" />
						<span className="text-xs font-medium text-ob-text-secondary mr-1">
							Debug
						</span>
						<Toggle
							toggled={showDebug}
							aria-label="Toggle debug mode"
							onClick={() => setShowDebug((prev) => !prev)}
						/>
					</div>

					<Button
						variant="ghost"
						size="md"
						shape="square"
						className="rounded-full h-9 w-9 text-ob-text-secondary hover:text-ob-text-primary hover:bg-ob-base-200"
						onClick={toggleTheme}
					>
						{theme === "dark" ? <SunIcon size={20} /> : <MoonIcon size={20} />}
					</Button>
				</div>
			</div>

			{/* 2-Column Layout */}
			<div className="flex-1 flex overflow-hidden">
				{/* Left Column: Timeline */}
				<div className="w-1/2 min-w-[400px] border-r border-ob-border bg-ob-base-100/50">
					<StreamView
						blocks={fluxState.stream}
						onDeleteBlock={handleDeleteBlock}
					/>
				</div>

				{/* Right Column: Chat (Copilot) */}
				<div className="flex-1 flex flex-col min-w-[400px] bg-ob-base-100 relative">
					{/* Header for Chat */}
					<div className="px-6 py-4 border-b border-ob-border flex justify-between items-center bg-ob-base-100/80 backdrop-blur-md sticky top-0 z-10">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500">
								<RobotIcon size={18} />
							</div>
							<div>
								<h2 className="font-semibold text-sm">Copilot</h2>
								<p className="text-xs text-ob-text-secondary">
									Ready to assist
								</p>
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							shape="square"
							className="text-ob-text-secondary hover:text-red-500 hover:bg-red-500/10"
							onClick={clearHistory}
						>
							<TrashIcon size={18} />
						</Button>
					</div>

					{/* Messages Area */}
					<div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 scroll-smooth">
						{agentMessages.length === 0 && (
							<div className="h-full flex flex-col items-center justify-center opacity-50 p-8 text-center">
								<RobotIcon size={48} className="mb-4 text-ob-base-300" />
								<h3 className="text-lg font-medium mb-2">
									How can I help you flow?
								</h3>
								<p className="text-sm max-w-xs">
									Ask the Architect to map out a goal or schedule a specific
									task onto your timeline.
								</p>
							</div>
						)}

						{agentMessages.map((m, index) => {
							const isUser = m.role === "user";
							const showAvatar =
								index === 0 || agentMessages[index - 1]?.role !== m.role;

							return (
								<div
									key={m.id}
									className={`flex ${isUser ? "justify-end" : "justify-start"} group`}
								>
									<div
										className={`flex gap-3 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
									>
										{/* Avatar */}
										<div
											className={`w-8 shrink-0 flex flex-col items-center ${!showAvatar ? "invisible" : ""}`}
										>
											{isUser ? (
												<div className="w-8 h-8 rounded-full bg-ob-base-300 flex items-center justify-center text-ob-text-secondary text-xs font-medium">
													U
												</div>
											) : (
												<Avatar username={"AI"} className="shrink-0" />
											)}
										</div>

										<div className="flex flex-col gap-1 w-full">
											{showDebug && (
												<pre className="text-[10px] text-ob-text-secondary/50 overflow-x-auto bg-ob-base-200/50 p-2 rounded-lg border border-ob-border mb-1 max-w-full">
													{JSON.stringify(m, null, 2)}
												</pre>
											)}

											{/* Message Content */}
											<div className="flex flex-col gap-2">
												{m.parts?.map((part, i) => {
													if (part.type === "text") {
														return (
															<Card
																key={`${m.id}-${i}`}
																className={`p-3.5 rounded-2xl shadow-sm border text-sm leading-relaxed ${
																	isUser
																		? "bg-brand-500 text-white border-transparent rounded-tr-none"
																		: "bg-ob-base-200 border-ob-border rounded-tl-none text-ob-text-primary"
																}`}
															>
																<MemoizedMarkdown
																	id={`${m.id}-${i}`}
																	content={part.text}
																/>
															</Card>
														);
													}

													if (
														isStaticToolUIPart(part) &&
														m.role === "assistant"
													) {
														const toolCallId = part.toolCallId;
														const toolName = part.type.replace("tool-", "");
														const needsConfirmation =
															toolsRequiringConfirmation.includes(
																toolName as keyof typeof tools,
															);

														return (
															<ToolInvocationCard
																key={`${toolCallId}-${i}`}
																toolUIPart={part}
																toolCallId={toolCallId}
																needsConfirmation={needsConfirmation}
																onSubmit={({ toolCallId, result }) => {
																	addToolResult({
																		tool: toolName,
																		toolCallId,
																		output: result,
																	});
																}}
																addToolResult={(toolCallId, result) => {
																	addToolResult({
																		tool: toolName,
																		toolCallId,
																		output: result,
																	});
																}}
															/>
														);
													}
													return null;
												})}
											</div>

											{/* Timestamp */}
											<span
												className={`text-[10px] text-ob-text-secondary opacity-0 group-hover:opacity-100 transition-opacity px-1 ${isUser ? "text-right" : "text-left"}`}
											>
												{formatTime(
													m.metadata?.createdAt
														? new Date(m.metadata.createdAt)
														: new Date(),
												)}
											</span>
										</div>
									</div>
								</div>
							);
						})}
						<div ref={messagesEndRef} />
					</div>

					{/* Input Area */}
					<div className="p-4 bg-ob-base-100 border-t border-ob-border">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleAgentSubmit(e);
								setTextareaHeight("auto");
							}}
							className="relative flex items-end gap-2 bg-ob-base-200 rounded-2xl p-2 border border-ob-border focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all"
						>
							<div className="pb-1 pl-1">
								<VoiceInput
									onTranscript={(transcript) => {
										setAgentInput((prev) => {
											const separator = prev.trim() ? " " : "";
											return prev + separator + transcript;
										});
										setTimeout(() => {
											const ta = document.querySelector("textarea");
											if (ta) {
												ta.style.height = "auto";
												ta.style.height = `${ta.scrollHeight}px`;
												setTextareaHeight(`${ta.scrollHeight}px`);
											}
										}, 0);
									}}
								/>
							</div>

							<Textarea
								disabled={pendingToolCallConfirmation}
								placeholder={
									pendingToolCallConfirmation
										? "Please confirm action above..."
										: "Type a message..."
								}
								className="flex-1 bg-transparent border-none focus:ring-0 p-2 min-h-[24px] max-h-[150px] resize-none text-sm placeholder:text-ob-text-secondary/50"
								value={agentInput}
								onChange={(e) => {
									handleAgentInputChange(e);
									e.target.style.height = "auto";
									e.target.style.height = `${e.target.scrollHeight}px`;
									setTextareaHeight(`${e.target.scrollHeight}px`);
								}}
								onKeyDown={(e) => {
									if (
										e.key === "Enter" &&
										!e.shiftKey &&
										!e.nativeEvent.isComposing
									) {
										e.preventDefault();
										handleAgentSubmit(e as unknown as React.FormEvent);
										setTextareaHeight("auto");
									}
								}}
								style={{ height: textareaHeight }}
								rows={1}
							/>

							<div className="pb-1 pr-1">
								{status === "submitted" || status === "streaming" ? (
									<Button
										type="button"
										onClick={stop}
										size="sm"
										shape="circular"
										variant="destructive"
										className="h-8 w-8"
									>
										<StopIcon weight="bold" />
									</Button>
								) : (
									<Button
										type="submit"
										disabled={pendingToolCallConfirmation || !agentInput.trim()}
										size="sm"
										shape="circular"
										className={`h-8 w-8 transition-all ${agentInput.trim() ? "bg-brand-500 text-white hover:bg-brand-600" : "bg-ob-base-300 text-ob-text-secondary cursor-not-allowed"}`}
									>
										<PaperPlaneTiltIcon weight="fill" />
									</Button>
								)}
							</div>
						</form>
						<div className="text-[10px] text-center text-ob-text-secondary mt-2">
							Flux AI can make mistakes. Review generated actions.
						</div>
					</div>
				</div>
			</div>

			{/* SVG Spirits Definition */}
			<svg width="0" height="0" className="hidden">
				<symbol id="ai:local:agents" viewBox="0 0 80 79">
					<path
						fill="currentColor"
						d="M69.3 39.7c-3.1 0-5.8 2.1-6.7 5H48.3V34h4.6l4.5-2.5c1.1.8 2.5 1.2 3.9 1.2 3.8 0 7-3.1 7-7s-3.1-7-7-7-7 3.1-7 7c0 .9.2 1.8.5 2.6L51.9 30h-3.5V18.8h-.1c-1.3-1-2.9-1.6-4.5-1.9h-.2c-1.9-.3-3.9-.1-5.8.6-.4.1-.8.3-1.2.5h-.1c-.1.1-.2.1-.3.2-1.7 1-3 2.4-4 4 0 .1-.1.2-.1.2l-.3.6c0 .1-.1.1-.1.2v.1h-.6c-2.9 0-5.7 1.2-7.7 3.2-2.1 2-3.2 4.8-3.2 7.7 0 .7.1 1.4.2 2.1-1.3.9-2.4 2.1-3.2 3.5s-1.2 2.9-1.4 4.5c-.1 1.6.1 3.2.7 4.7s1.5 2.9 2.6 4c-.8 1.8-1.2 3.7-1.1 5.6 0 1.9.5 3.8 1.4 5.6s2.1 3.2 3.6 4.4c1.3 1 2.7 1.7 4.3 2.2v-.1q2.25.75 4.8.6h.1c0 .1.1.1.1.1.9 1.7 2.3 3 4 4 .1.1.2.1.3.2h.1c.4.2.8.4 1.2.5 1.4.6 3 .8 4.5.7.4 0 .8-.1 1.3-.1h.1c1.6-.3 3.1-.9 4.5-1.9V62.9h3.5l3.1 1.7c-.3.8-.5 1.7-.5 2.6 0 3.8 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7c-1.5 0-2.8.5-3.9 1.2l-4.6-2.5h-4.6V48.7h14.3c.9 2.9 3.5 5 6.7 5 3.8 0 7-3.1 7-7s-3.1-7-7-7m-7.9-16.9c1.6 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.4-3 3-3m0 41.4c1.6 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.4-3 3-3M44.3 72c-.4.2-.7.3-1.1.3-.2 0-.4.1-.5.1h-.2c-.9.1-1.7 0-2.6-.3-1-.3-1.9-.9-2.7-1.7-.7-.8-1.3-1.7-1.6-2.7l-.3-1.5v-.7q0-.75.3-1.5c.1-.2.1-.4.2-.7s.3-.6.5-.9c0-.1.1-.1.1-.2.1-.1.1-.2.2-.3s.1-.2.2-.3c0 0 0-.1.1-.1l.6-.6-2.7-3.5c-1.3 1.1-2.3 2.4-2.9 3.9-.2.4-.4.9-.5 1.3v.1c-.1.2-.1.4-.1.6-.3 1.1-.4 2.3-.3 3.4-.3 0-.7 0-1-.1-2.2-.4-4.2-1.5-5.5-3.2-1.4-1.7-2-3.9-1.8-6.1q.15-1.2.6-2.4l.3-.6c.1-.2.2-.4.3-.5 0 0 0-.1.1-.1.4-.7.9-1.3 1.5-1.9 1.6-1.5 3.8-2.3 6-2.3q1.05 0 2.1.3v-4.5c-.7-.1-1.4-.2-2.1-.2-1.8 0-3.5.4-5.2 1.1-.7.3-1.3.6-1.9 1s-1.1.8-1.7 1.3c-.3.2-.5.5-.8.8-.6-.8-1-1.6-1.3-2.6-.2-1-.2-2 0-2.9.2-1 .6-1.9 1.3-2.6.6-.8 1.4-1.4 2.3-1.8l1.8-.9-.7-1.9c-.4-1-.5-2.1-.4-3.1s.5-2.1 1.1-2.9q.9-1.35 2.4-2.1c.9-.5 2-.8 3-.7.5 0 1 .1 1.5.2 1 .2 1.8.7 2.6 1.3s1.4 1.4 1.8 2.3l4.1-1.5c-.9-2-2.3-3.7-4.2-4.9q-.6-.3-.9-.6c.4-.7 1-1.4 1.6-1.9.8-.7 1.8-1.1 2.9-1.3.9-.2 1.7-.1 2.6 0 .4.1.7.2 1.1.3V72zm25-22.3c-1.6 0-3-1.3-3-3 0-1.6 1.3-3 3-3s3 1.3 3 3c0 1.6-1.3 3-3 3"
					/>
				</symbol>
			</svg>
		</div>
	);
}

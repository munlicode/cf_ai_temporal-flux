import { Card } from "@/components/card/Card";
import type { StreamBlock } from "@shared";
import { ClockIcon, CalendarDotsIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/button/Button";

interface StreamViewProps {
	blocks: StreamBlock[];
	onDeleteBlock: (id: string) => void;
}

export function StreamView({ blocks, onDeleteBlock }: StreamViewProps) {
	const sortedBlocks = [...blocks].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
	);

	return (
		<div className="flex flex-col h-full bg-ob-base-200/30">
			<div className="p-4 border-b border-ob-border flex justify-between items-center bg-ob-base-100/50 backdrop-blur-sm sticky top-0 z-10">
				<h2 className="font-semibold text-lg text-ob-text-primary flex items-center gap-2">
					<CalendarDotsIcon className="text-brand-500" size={20} />
					Execution Timeline
				</h2>
				<span className="text-xs text-ob-text-secondary bg-ob-base-200 px-2 py-1 rounded-full border border-ob-border">
					Roadmap
				</span>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
				{/* Timeline Line */}
				<div className="absolute left-8 top-4 bottom-4 w-px bg-ob-border/50" />

				{sortedBlocks.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-ob-text-secondary opacity-60">
						<ClockIcon size={48} className="mb-4 text-ob-base-300" />
						<p>Your timeline is empty.</p>
						<p className="text-xs mt-2">Ask the Architect to map out a goal!</p>
					</div>
				) : (
					sortedBlocks.map((block) => {
						const startTime = new Date(block.startTime);
						const endTime = new Date(block.endTime);
						const duration =
							(endTime.getTime() - startTime.getTime()) / (1000 * 60);

						return (
							<div key={block.id} className="relative pl-8 group">
								{/* Time Indicator */}
								<div className="absolute left-0 top-0 text-[10px] font-mono text-ob-text-secondary bg-ob-base-100 px-1 rounded border border-ob-border z-10 w-12 text-center">
									{startTime.toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>

								{/* Block Card */}
								<Card
									className={`p-3 border-l-4 ${
										block.status === "completed"
											? "border-l-green-500 opacity-60"
											: block.status === "cancelled"
												? "border-l-red-500 opacity-40"
												: "border-l-brand-500"
									} bg-ob-base-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
								>
									<div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
										<Button
											variant="ghost"
											size="sm"
											shape="square"
											className="h-6 w-6 text-ob-text-secondary hover:text-red-500 hover:bg-red-500/10"
											onClick={(e) => {
												e.stopPropagation();
												onDeleteBlock(block.id);
											}}
										>
											<TrashIcon size={14} />
										</Button>
									</div>
									<div className="flex justify-between items-start pr-6">
										<div className="space-y-1">
											<h3 className="font-semibold text-sm text-ob-text-primary">
												{block.title}
											</h3>
											{block.description && (
												<p className="text-xs text-ob-text-secondary line-clamp-2 leading-relaxed">
													{block.description}
												</p>
											)}
											<div className="flex items-center gap-3 pt-1">
												<span className="text-[10px] font-medium text-ob-text-secondary flex items-center gap-1">
													<ClockIcon size={12} />
													{duration} mins
												</span>
												{block.priority === "high" && (
													<span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
														High Priority
													</span>
												)}
											</div>
										</div>
									</div>
								</Card>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}

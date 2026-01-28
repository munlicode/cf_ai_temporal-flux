import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Chat from "./app";
import { Providers } from "./providers";
import "./styles.css";

const container = document.getElementById("app");
if (!container) {
	throw new Error("Failed to find the root element");
}

const root = createRoot(container);
root.render(
	<StrictMode>
		<Providers>
			<Chat />
		</Providers>
	</StrictMode>,
);

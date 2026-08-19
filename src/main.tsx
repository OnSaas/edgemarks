import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import { I18nProvider } from "./lib/i18n";
import { ThemeProvider } from "./lib/theme";
import "./index.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<I18nProvider>
			<ThemeProvider>
				<AuthProvider>
					<BrowserRouter>
						<App />
					</BrowserRouter>
				</AuthProvider>
			</ThemeProvider>
		</I18nProvider>
	</StrictMode>,
);

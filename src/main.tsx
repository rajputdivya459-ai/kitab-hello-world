import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { seedIfVersionChanged } from "@/mock/db";
import { SEEDS } from "@/mock/seeds";
import { SEED_VERSION } from "@/mock/users";

// Seed LocalStorage runtime DB. Re-seeds automatically when SEED_VERSION changes.
seedIfVersionChanged(SEED_VERSION, SEEDS);

createRoot(document.getElementById("root")!).render(<App />);


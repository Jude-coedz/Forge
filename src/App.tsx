import { ForgeProvider } from "./store/ForgeContext";
import { AppShell } from "./components/layout/AppShell";

export default function App() {
  return (
    <ForgeProvider>
      <AppShell />
    </ForgeProvider>
  );
}

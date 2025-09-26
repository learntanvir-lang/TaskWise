import { Dashboard } from "@/components/dashboard";
import { initialTasks } from "@/lib/data";

export default function Home() {
  return (
    <main>
      <Dashboard initialTasks={initialTasks} />
    </main>
  );
}

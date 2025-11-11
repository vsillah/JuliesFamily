import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { StudentDashboard as StudentDashboardComponent } from "@/components/StudentDashboard";

export default function StudentDashboardPage() {
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation heroImageLoaded={heroImageLoaded} />
      <main className="flex-1">
        <StudentDashboardComponent />
      </main>
      <Footer />
    </div>
  );
}

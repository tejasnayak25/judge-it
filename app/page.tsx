import Link from "next/link";
import { Shield, ArrowRight, CheckCircle2, Lock, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent -z-10"></div>
          
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground mb-4">
                v1.0.0 is now live
              </div>
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl font-outfit">
                Fair Judging, <span className="text-muted-foreground">Simplified.</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                A secure, sequential competition review platform. Built for accuracy, speed, and integrity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-8 py-4 text-sm font-semibold shadow-sm transition-all hover:bg-muted hover:scale-105 active:scale-95"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-outfit">Strict Sequential Flow</h3>
                <p className="text-muted-foreground">
                  Judges review teams one-by-one. No backtracking, no editing after submission.
                </p>
              </div>
              <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-outfit">Multi-Judge System</h3>
                <p className="text-muted-foreground">
                  Each slot is evaluated by two independent judges for maximum fairness.
                </p>
              </div>
              <div className="glass-card p-8 rounded-3xl space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-outfit">Secure Results</h3>
                <p className="text-muted-foreground">
                  Assignments remain hidden until revealed by the administrator.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-6">
        <div className="container px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 mx-auto">
          <p className="text-sm text-muted-foreground">
            © 2026 JudgeIt Platform. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

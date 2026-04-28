'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Eye, BarChart3, Zap, Shield } from 'lucide-react';

export default function Home() {
  useEffect(() => {
    // Redirect to dashboard if user is authenticated
    // TODO: Check auth status and redirect accordingly
    redirect('/dashboard');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Eye className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">EyeGuard</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/login" className="text-foreground hover:text-primary transition-colors">
            Login
          </a>
          <a
            href="/signup"
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Sign Up
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-8 py-20">
        <div className="max-w-4xl text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Protect Your Eyes, <span className="text-primary">Predict the Risk</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            EyeGuard uses advanced AI to predict eye strain and digital fatigue. Track your screen
            time, get personalized recommendations, and maintain better eye health.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
            >
              Get Started Free
            </a>
            <a
              href="/login"
              className="px-8 py-3 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors font-semibold"
            >
              Login
            </a>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Eye Strain Tracking</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Monitor your eye strain symptoms and patterns over time with detailed analytics.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">AI Predictions</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Get accurate predictions of your eye strain risk tomorrow and next week.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-border bg-card hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Smart Recommendations</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Receive personalized wellness recommendations based on your usage patterns.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 py-8 border-y border-border">
            <div>
              <p className="text-3xl font-bold text-primary">87%</p>
              <p className="text-sm text-muted-foreground mt-1">Prediction Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">500+</p>
              <p className="text-sm text-muted-foreground mt-1">Active Users</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">60M+</p>
              <p className="text-sm text-muted-foreground mt-1">Data Points Analyzed</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 px-8 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2024 EyeGuard. Protecting your vision with AI. Made for college students and digital
          professionals.
        </p>
      </footer>
    </div>
  );
}

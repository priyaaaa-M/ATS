"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { useAuthStore } from "@/lib/store/auth-store";
import { useLayoutStore } from "@/lib/store/layout-store";
import { motion, AnimatePresence } from "framer-motion";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { sidebarCollapsed } = useLayoutStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Initializing HireOS...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <motion.div
        initial={false}
        animate={{
          paddingLeft: sidebarCollapsed ? "100px" : "280px",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col min-h-screen"
      >
        <main className="flex-1 pt-6 md:pt-8 pb-0 max-w-[1600px] mx-auto w-full flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
}

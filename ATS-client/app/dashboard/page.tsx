"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { candidatesApi } from "@/lib/api/candidates";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { Filter, Plus } from "lucide-react";
import { NewCandidateDialog } from "@/components/candidates/new-candidate-dialog";

const STAGES = [
  { id: "parsing", label: "AI Parsing", color: "#8B5CF6", pct: "100%" },
  { id: "hr", label: "HR Review", color: "#F59E0B", pct: "67%" },
  { id: "r1", label: "Round 1", color: "#3B82F6", pct: "50%" },
  { id: "r2", label: "Round 2", color: "#3B82F6", pct: "36%" },
  { id: "selected", label: "Selected", color: "#10B981", pct: "17%" },
];

const ROLE_FILTERS = ["All Roles", "Backend", "Frontend", "DevOps"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};



const statsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};


const columnContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};




const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const columnVariants = {
  hidden: { opacity: 0, x: 15 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};


const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};



export default function DashboardPage() {
  const { user } = useAuthStore();
  const [activeRole, setActiveRole] = useState("All Roles");
  const [isNewCandidateOpen, setIsNewCandidateOpen] = useState(false);

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["dashboard-candidates"],
    queryFn: () => candidatesApi.list(),
  });

  const stagedCandidates = useMemo(() => {
    const filtered =
      activeRole === "All Roles"
        ? candidates
        : candidates.filter((c) =>
            c.role.toLowerCase().includes(activeRole.toLowerCase()),
          );

    return {
      parsing: filtered.filter((c) => c.status === "pending").slice(0, 5),
      hr: filtered.filter((c) => c.status === "hr_approved").slice(0, 5),
      r1: filtered.filter((c) => c.status === "scheduled").slice(0, 5),
      r2: filtered.filter((c) => c.status === "scheduled" && false).slice(0, 5),
      selected: filtered.filter((c) => c.status === "selected").slice(0, 5),
    };
  }, [candidates, activeRole]);

  const stats = [
    {
      label: "Total Applicants",
      value: candidates.length,
    },
    {
      label: "Awaiting Review",
      value: candidates.filter((c) => c.status === "pending").length,
    },
    {
      label: "Interviews Today",
      value: 7,
    },
    {
      label: "Selected",
      value: candidates.filter((c) => c.status === "selected").length,
    },
  ];

  return (
    <AppShell>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8 pb-10"
      >
        {/* Header Section */}
        <motion.div
          variants={itemVariants}
          className="px-6 md:px-8 flex items-center justify-between"
        >
          <div className="flex flex-col gap-1">
            <h1 className="text-5xl font-black tracking-tight text-foreground">
              Managing{" "}
              <span className="text-muted-foreground/40 font-medium">
                Pipeline
              </span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg">
              Welcome back, {user?.name || "Priya"}. Here's your workflow today.
            </p>
          </div>
          <Button 
            onClick={() => setIsNewCandidateOpen(true)}
            className="rounded-full !px-6 h-14 bg-[#09090B] dark:bg-white hover:bg-[#09090B]/90 dark:hover:bg-white/90 text-white dark:text-black font-bold shadow-xl hover:scale-105 transition-transform"
          >
            <Plus className="mr-2 h-5 w-5" /> Add new candidate
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={statsContainerVariants}
          className="px-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className={cn(
                "group bg-card rounded-[2rem] p-8 shadow-premium transition-all cursor-pointer hover:translate-y-[-4px]",
                i === 0 && "bg-lime dark:bg-lime/10",
                i === 2 && "bg-blue-soft dark:bg-blue-soft/10",
              )}
            >
              <div className="space-y-1">
                <div className="text-5xl font-black tracking-tighter">
                  {isLoading ? "..." : stat.value}
                </div>
                <div className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Funnel Section */}
        <div className="space-y-4">
          <div className="px-6 md:px-8 flex items-center justify-between mb-8">
            <motion.div variants={itemVariants} className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-foreground">
                Hiring Funnel
              </h2>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </motion.div>
            <motion.div variants={itemVariants} className="flex items-center gap-1 p-1.5 bg-card rounded-full shadow-premium">
              {ROLE_FILTERS.map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={cn(
                    "px-6 py-2.5 text-[13px] font-black rounded-full transition-all",
                    activeRole === role
                      ? "bg-foreground text-background shadow-lg"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {role}
                </button>
              ))}
            </motion.div>
          </div>

          <motion.div 
            variants={columnContainerVariants}
            className="w-full overflow-x-auto pb-8 min-h-[450px] snap-x scrollbar-thin"
          >
            <div className="flex items-start gap-3 px-6 md:px-8 min-w-max">
              {STAGES.map((stage, idx) => {
                const cands =
                  stagedCandidates[stage.id as keyof typeof stagedCandidates] ||
                  [];
                return (
                  <motion.div
                    key={stage.id}
                    variants={columnVariants}
                    className="flex flex-col min-h-[450px] rounded-[2.5rem] bg-card shadow-premium overflow-hidden min-w-[320px] max-w-[320px] shrink-0 snap-center"
                  >
                    <div className="px-5 pt-6 pb-4 flex items-center justify-between bg-secondary/10">
                      <div className="flex flex-col gap-0.5">
                        <h3 className="text-[15px] font-bold text-foreground tracking-tight">
                          {stage.label}
                        </h3>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          {stage.pct} conv.
                        </span>
                      </div>
                      <div
                        className="text-4xl font-black tracking-tighter leading-none"
                        style={{ color: stage.color }}
                      >
                        {cands.length}
                      </div>
                    </div>

                    <motion.div 
                      variants={cardContainerVariants}
                      className="flex-1 p-3 flex flex-col gap-1.5 overflow-y-auto max-h-[450px] scrollbar-none"
                    >
                      <AnimatePresence mode="popLayout">
                        {cands.map((candidate) => (
                          <motion.div
                            key={candidate.id}
                            layout
                            variants={cardVariants}
                            className="group bg-background rounded-[2rem] p-6 min-h-[100px] flex flex-col justify-between shadow-sm hover:shadow-md transition-all border border-transparent hover:border-primary/10"
                          >
                            <div className="text-[13px] font-black text-foreground truncate mb-1">
                              {candidate.name}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-muted-foreground font-bold truncate pr-2 uppercase tracking-tight">
                                {candidate.role}
                              </span>
                              <div
                                className={cn(
                                  "text-[10px] font-black px-2 py-0.5 rounded-full",
                                  candidate.ats_score &&
                                    candidate.ats_score >= 85
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : candidate.ats_score &&
                                        candidate.ats_score >= 70
                                      ? "bg-amber-500/10 text-amber-600"
                                      : "bg-rose-500/10 text-rose-600",
                                )}
                              >
                                {candidate.ats_score || "70"}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {cands.length === 0 && !isLoading && (
                        <div className="h-24 flex flex-col items-center justify-center">
                          <span className="text-[11px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                            No Cards
                          </span>
                        </div>
                      )}
                      </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </motion.div>
      <NewCandidateDialog 
        open={isNewCandidateOpen} 
        onOpenChange={setIsNewCandidateOpen} 
      />
    </AppShell>
  );
}

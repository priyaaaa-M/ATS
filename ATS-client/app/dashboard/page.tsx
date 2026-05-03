"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { candidatesApi } from "@/lib/api/candidates";
import { interviewsApi } from "@/lib/api/interviews";
import { useAuthStore } from "@/lib/store/auth-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/app-shell";
import { Plus } from "lucide-react";
import { NewCandidateDialog } from "@/components/candidates/new-candidate-dialog";
import { CandidateDrawer } from "@/components/candidates/candidate-drawer";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { driveApi } from "@/lib/api/drive";
import { companyApi } from "@/lib/api/company";
import { useEffect } from "react";

function normalizeRoleName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
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
      ease: [0.16, 1, 0.3, 1] as const,
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
      ease: [0.16, 1, 0.3, 1] as const,
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
      ease: [0.16, 1, 0.3, 1] as const,
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

const roundStatusColor: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  scheduled: "bg-blue-500/10 text-blue-600",
  interviewing: "bg-purple-500/10 text-purple-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  cancelled: "bg-rose-500/10 text-rose-600",
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [activeRole, setActiveRole] = useState("All Roles");
  const [isNewCandidateOpen, setIsNewCandidateOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  const { data: companyProfile, refetch: refetchCompany } = useQuery({
    queryKey: ["company-profile"],
    queryFn: () => companyApi.getProfile(),
  });

  const [isClient, setIsClient] = useState(false);
  const [funnelConfig, setFunnelConfig] = useState<{
    stages: any[];
    hrRounds: number;
    interviewRounds: number;
  } | null>(null);
  const [hrRounds, setHrRounds] = useState(1);
  const [interviewRounds, setInterviewRounds] = useState(2);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (companyProfile?.funnel_config) {
      setFunnelConfig(companyProfile.funnel_config);
    }
  }, [companyProfile?.funnel_config]);

  const handleCreateFunnel = () => {
    const newStages = [
      { id: "parsing", label: "AI Parsing", color: "#8B5CF6", pct: "100%" },
    ];
    for (let i = 1; i <= hrRounds; i++) {
      newStages.push({
        id: `hr${i}`,
        label: hrRounds > 1 ? `HR Review ${i}` : `HR Review`,
        color: "#F59E0B",
        pct: "67%",
      });
    }
    for (let i = 1; i <= interviewRounds; i++) {
      newStages.push({
        id: `r${i}`,
        label: `Round ${i}`,
        color: "#3B82F6",
        pct: "50%",
      });
    }
    newStages.push({
      id: "selected",
      label: "Selected",
      color: "#10B981",
      pct: "17%",
    });

    const config = { stages: newStages, hrRounds, interviewRounds };
    setFunnelConfig(config);
    companyApi.updateProfile({ funnelConfig: config }).catch((err) => {
      console.error("Failed to save funnel config to backend:", err);
    });
  };

  const { data: driveContents } = useQuery({
    queryKey: ["drive-contents"],
    queryFn: () => driveApi.getContents(),
  });

  const displayRoles =
    driveContents?.contents
      ?.filter((item) => item.isFolder && item.name.toLowerCase() !== "rules")
      ?.map((item) => ({ id: item.id, name: item.name })) || [];

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["dashboard-candidates"],
    queryFn: () => candidatesApi.list(),
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ["dashboard-interviews"],
    queryFn: () => interviewsApi.list(),
  });

  const stagedCandidates = useMemo(() => {
    const filtered =
      activeRole === "All Roles"
        ? candidates
        : candidates.filter((c) =>
            c.role.toLowerCase().includes(normalizeRoleName(activeRole)),
          );

    if (!funnelConfig) return {};

    const mapping: Record<string, any[]> = {};

    funnelConfig.stages.forEach((stage) => {
      if (stage.id === "parsing") {
        mapping[stage.id] = filtered
          .filter((c) => c.status === "pending")
          .slice(0, 5);
      } else if (stage.id.startsWith("hr")) {
        mapping[stage.id] = filtered
          .filter((c) => c.status === "hr_approved")
          .slice(0, 5);
      } else if (stage.id.startsWith("r")) {
        const rNum = parseInt(stage.id.replace("r", ""));
        mapping[stage.id] = filtered
          .filter((c) => c.status === "scheduled" && c.current_round === rNum)
          .slice(0, 5);
      } else if (stage.id === "selected") {
        mapping[stage.id] = filtered
          .filter((c) => c.status === "selected")
          .slice(0, 5);
      }
    });

    return mapping;
  }, [candidates, activeRole, funnelConfig]);

  const interviewsToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return interviews.filter((i) => i.scheduled_at?.split("T")[0] === today)
      .length;
  }, [interviews]);

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
      value: interviewsToday,
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
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-3"
            >
              <h2 className="text-2xl font-black text-foreground">
                Hiring Funnel
              </h2>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-1"
            >
              {funnelConfig && (
                <Select value={activeRole} onValueChange={setActiveRole}>
                  <SelectTrigger className="w-[180px] bg-card shadow-premium rounded-full border-none font-medium h-10">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-premium bg-card">
                    <SelectItem
                      value="All Roles"
                      className="rounded-lg cursor-pointer"
                    >
                      All Roles
                    </SelectItem>
                    {displayRoles.map((role) => (
                      <SelectItem
                        key={role.id}
                        value={role.name}
                        className="rounded-lg cursor-pointer"
                      >
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </motion.div>
          </div>

          {!isClient ? null : !funnelConfig ? (
            <motion.div
              variants={itemVariants}
              className="bg-card rounded-[2.5rem] p-8 shadow-premium border border-border/40 max-w-2xl mx-auto"
            >
              <h3 className="text-2xl font-black mb-6">
                Setup your Hiring Funnel
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="hrRounds"
                    className="text-sm font-bold text-muted-foreground"
                  >
                    Number of HR Review Rounds
                  </Label>
                  <Input
                    id="hrRounds"
                    type="number"
                    min={1}
                    max={3}
                    value={hrRounds}
                    onChange={(e) => setHrRounds(parseInt(e.target.value) || 1)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="intRounds"
                    className="text-sm font-bold text-muted-foreground"
                  >
                    Number of Interview Rounds
                  </Label>
                  <Input
                    id="intRounds"
                    type="number"
                    min={1}
                    max={5}
                    value={interviewRounds}
                    onChange={(e) =>
                      setInterviewRounds(parseInt(e.target.value) || 1)
                    }
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleCreateFunnel}
                  className="w-full h-12 rounded-xl bg-foreground text-background font-bold hover:scale-[1.02] transition-transform"
                >
                  Create Funnel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              variants={columnContainerVariants}
              className="w-full overflow-x-auto pb-8 min-h-[450px] snap-x scrollbar-thin"
            >
              <div className="flex items-start gap-3 px-6 md:px-8 min-w-max">
                {funnelConfig.stages.map((stage, idx) => {
                  const cands =
                    stagedCandidates[
                      stage.id as keyof typeof stagedCandidates
                    ] || [];
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
                              onClick={() => setSelectedCandidate(candidate)}
                              className="group bg-background rounded-[2rem] p-6 min-h-[100px] flex flex-col justify-between shadow-sm hover:shadow-md transition-all border border-transparent hover:border-primary/10 cursor-pointer"
                            >
                              <div className="text-[13px] font-black text-foreground truncate mb-1">
                                {candidate.name}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1 min-w-0">
                                  <span className="text-[11px] text-muted-foreground font-bold truncate uppercase tracking-tight">
                                    {candidate.role}
                                  </span>
                                  {candidate.status === 'scheduled' && (
                                    <span className={cn(
                                      "text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter w-fit",
                                      roundStatusColor[candidate.round_status || 'pending']
                                    )}>
                                      {candidate.round_status || 'Pending'}
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={cn(
                                    "text-[10px] font-black px-2 py-0.5 rounded-full shrink-0",
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
          )}
        </div>
      </motion.div>
      <NewCandidateDialog
        open={isNewCandidateOpen}
        onOpenChange={setIsNewCandidateOpen}
      />
      <CandidateDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        funnelStages={funnelConfig?.stages || []}
      />
    </AppShell>
  );
}

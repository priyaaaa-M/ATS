"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  Trash2,
  Info,
  File,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { driveApi } from "@/lib/api";
import type { DriveItem } from "@/lib/api/drive";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

function FileTreeItem({
  item,
  level = 0,
  selectedFile,
  onSelectFile,
  defaultExpanded = false,
}: {
  item: DriveItem;
  level?: number;
  selectedFile: DriveItem | null;
  onSelectFile: (file: DriveItem) => void;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const isSelected = selectedFile?.id === item.id;

  const { data, isLoading } = useQuery({
    queryKey: ["drive-contents", item.id],
    queryFn: () =>
      driveApi.getContents(item.id === "root" ? undefined : item.id),
    enabled: isExpanded && item.isFolder,
  });

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex items-center py-2 px-3 rounded-xl transition-all cursor-pointer group select-none relative",
          isSelected
            ? "bg-primary/10 text-primary font-bold"
            : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground font-medium",
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => {
          if (item.isFolder) {
            setIsExpanded(!isExpanded);
          } else {
            onSelectFile(item);
          }
        }}
      >
        {isSelected && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1 bottom-1 w-1.5 bg-primary rounded-r-full"
          />
        )}

        <div className="flex items-center gap-2.5 w-full overflow-hidden">
          <div className="flex items-center justify-center w-4 shrink-0 transition-transform">
            {item.isFolder ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-foreground/50 group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronRight className="h-4 w-4 text-foreground/50 group-hover:text-foreground transition-colors" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          <div
            className={cn(
              "flex shrink-0 items-center justify-center transition-all",
              item.isFolder
                ? "text-blue-500/80"
                : isSelected
                  ? "text-primary"
                  : "text-muted-foreground/80",
            )}
          >
            {item.isFolder ? (
              <Folder
                className="h-4.5 w-4.5"
                fill="currentColor"
                fillOpacity={isExpanded ? 0.3 : 0.1}
              />
            ) : (
              <FileText className="h-4.5 w-4.5" />
            )}
          </div>

          <span className="text-[14px] tracking-tight truncate font-bold">
            {item.name}
          </span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && item.isFolder && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {isLoading ? (
              <div
                className="py-1"
                style={{ paddingLeft: `${(level + 1) * 16 + 36}px` }}
              >
                <Skeleton className="h-5 w-28 rounded-md bg-surface-2" />
              </div>
            ) : data?.contents.length === 0 ? (
              <div
                className="py-1.5 text-[11px] font-bold text-muted-foreground/30 uppercase tracking-widest"
                style={{ paddingLeft: `${(level + 1) * 16 + 36}px` }}
              >
                Empty
              </div>
            ) : (
              <div className="mt-1 mb-1">
                {data?.contents.map((child) => (
                  <FileTreeItem
                    key={child.id}
                    item={child}
                    level={level + 1}
                    selectedFile={selectedFile}
                    onSelectFile={onSelectFile}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DriveSyncPage() {
  const [selectedFile, setSelectedFile] = useState<DriveItem | null>(null);

  const rootItem: DriveItem = {
    id: "root",
    name: "Resume-ATS",
    isFolder: true,
    mimeType: "application/vnd.google-apps.folder",
    webViewLink: "",
    iconLink: "",
  };

  return (
    <AppShell>
      <div className="px-6 md:px-8 flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Header Section - Dashboard Style */}
        <div className="flex items-center justify-between shrink-0 mb-6 mt-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-5xl font-black tracking-tight text-foreground flex items-center gap-4">
              Drive{" "}
              <span className="text-muted-foreground/40 font-medium">Sync</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg">
              Manage synced files from Google Drive
            </p>
          </div>
          <Button
            className="rounded-full bg-[#09090B] dark:bg-white text-white dark:text-black shadow-xl h-14 px-8 font-bold text-[14px] hover:scale-105 transition-all gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-5 w-5" />
            Sync Storage
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-6 flex-1 min-h-0 pb-4">
          {/* Sidebar (Left) */}
          <Card className="w-[300px] shrink-0 bg-card border-none rounded-[2.5rem] shadow-premium flex flex-col overflow-hidden">
            <CardContent className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              <div className="flex flex-col gap-1">
                <FileTreeItem
                  item={rootItem}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                  defaultExpanded={true}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview (Right) */}
          <Card className="flex-1 bg-card border-none rounded-[2.5rem] shadow-premium flex flex-col overflow-hidden relative">
            {selectedFile ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={selectedFile.id}
                className="flex flex-col h-full"
              >
                <div className="px-8 py-5 border-b border-border/5 flex justify-between items-center bg-secondary/5 shrink-0 z-10 backdrop-blur-sm">
                  <div className="flex items-center gap-4 overflow-hidden mr-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <File className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-[18px] font-black tracking-tight truncate">
                        {selectedFile.name}
                      </h2>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                        PDF Document Preview
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-11 w-11 text-muted-foreground hover:bg-secondary/20 hover:text-foreground"
                    >
                      <Info className="h-6 w-6" />
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(selectedFile.webViewLink, "_blank")
                      }
                      variant="secondary"
                      size="sm"
                      className="rounded-full h-11 px-6 font-bold text-[13px] bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary transition-all"
                    >
                      <ExternalLink className="h-4.5 w-4.5 mr-2" /> Open Native
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-11 w-11 text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 p-0 relative bg-muted/5">
                  <iframe
                    src={selectedFile.webViewLink.replace(
                      /\/view(\?.*)?$/,
                      "/preview",
                    )}
                    className="w-full h-full border-0 absolute inset-0"
                    allow="autoplay"
                    title={selectedFile.name}
                  />
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-secondary/5">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", delay: 0.05 }}
                  className="flex flex-col items-center"
                >
                  <div className="h-24 w-24 rounded-[2rem] bg-secondary/30 flex items-center justify-center mb-8 shadow-inner">
                    <FileText className="h-10 w-10 opacity-30" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground tracking-tight mb-2">
                    No File Selected
                  </h3>
                  <p className="font-medium text-lg max-w-[300px] text-center opacity-50">
                    Select a document from the explorer to preview its contents.
                  </p>
                </motion.div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

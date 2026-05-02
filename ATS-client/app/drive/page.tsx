'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Folder, FileText, ChevronRight, HardDrive, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { driveApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

export default function DriveSyncPage() {
  const [folderHistory, setFolderHistory] = useState<string[]>([])
  
  const currentFolderId = folderHistory.length > 0 ? folderHistory[folderHistory.length - 1] : undefined

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['drive-contents', currentFolderId],
    queryFn: () => driveApi.getContents(currentFolderId),
  })

  const handleNavigateIn = (folderId: string) => {
    setFolderHistory((prev) => [...prev, folderId])
  }

  const handleNavigateBack = () => {
    setFolderHistory((prev) => prev.slice(0, -1))
  }

  return (
    <AppShell>
      <div className="px-6 md:px-8 space-y-8 pb-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-5xl font-black tracking-tight text-foreground flex items-center gap-4">
              Drive <span className="text-muted-foreground/40 font-medium">Sync</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg">Manage synced files and folders from Google Drive</p>
          </div>
          <Button 
            className="rounded-full bg-[#09090B] dark:bg-white text-white dark:text-black shadow-xl h-14 px-8 font-bold text-[14px] hover:scale-105 transition-all gap-2"
            onClick={() => refetch()}
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            Sync Storage
          </Button>
        </div>

        <Card className="bg-card border-0 rounded-[2.5rem] shadow-premium overflow-hidden">
          <CardHeader className="bg-secondary/10 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNavigateBack}
                  disabled={folderHistory.length === 0}
                  className="h-10 w-10 rounded-full bg-background/50 text-foreground hover:bg-background shadow-sm disabled:opacity-20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-black text-muted-foreground/40 uppercase tracking-widest">Storage</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/20" />
                  <span className="text-[14px] font-black text-foreground uppercase tracking-widest">
                    {folderHistory.length > 0 ? "Current Folder" : "Resume-ATS"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/20 text-[11px] font-black uppercase tracking-tighter text-muted-foreground">
                <HardDrive className="h-3.5 w-3.5" />
                Google Cloud Storage
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg bg-surface-2" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-brand-red">
                <p>Failed to load drive contents. Please ensure Google Drive is connected in Settings.</p>
              </div>
            ) : data?.contents.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Folder className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>This folder is empty</p>
              </div>
            ) : (
              <div className="divide-y-0 space-y-1">
                {data?.contents.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 px-6 hover:bg-secondary/5 rounded-[1.5rem] transition-all group cursor-pointer"
                    onClick={() => {
                      if (item.isFolder) {
                        handleNavigateIn(item.id)
                      } else if (item.webViewLink) {
                        window.open(item.webViewLink, '_blank')
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background group-hover:scale-110 transition-all shadow-lg shadow-black/5">
                        {item.isFolder ? (
                          <Folder className="h-6 w-6" />
                        ) : (
                          <FileText className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-foreground group-hover:text-primary transition-colors tracking-tight">
                          {item.name}
                        </p>
                        <p className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] mt-0.5">
                          {item.isFolder ? 'Directory' : 'PDF Document'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {!item.isFolder && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-secondary/10 opacity-0 group-hover:opacity-100 transition-all text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (item.webViewLink) {
                              window.open(item.webViewLink, '_blank')
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

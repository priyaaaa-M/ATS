import { Bell, Moon, Plus, Search, Sun, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { rolesApi } from '../../api'
import { Input } from '../ui/input'
import { useThemeStore } from '../../store/themeStore'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Label } from '../ui/label'

export function TopBar() {
  const queryClient = useQueryClient()
  const mode = useThemeStore((state) => state.mode)
  const toggleMode = useThemeStore((state) => state.toggleMode)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [roleTitle, setRoleTitle] = useState('')

  const createRoleMutation = useMutation({
    mutationFn: () => rolesApi.create(roleTitle),
    onSuccess: () => {
      toast.success('Role created successfully')
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setIsDialogOpen(false)
      setRoleTitle('')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not create role')
    },
  })

  return (
    <div className="sticky top-0 z-10 flex h-[68px] items-center justify-between px-8 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex-1"></div>
      
      <div className="flex items-center justify-center flex-1">
        <div className="relative w-full max-w-md group hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-brand transition-colors" />
          <Input 
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-brand focus:border-brand transition-all rounded-full h-9 text-sm" 
            placeholder="Search candidates, roles, interviews..." 
          />
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-3 flex-1">
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="btn-primary-glow rounded-full font-semibold gap-2 h-9 px-5 shadow-lg shadow-brand/10 transition-all hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          <span>New Role</span>
        </Button>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] glass-card border-border bg-background">
            <DialogHeader>
              <DialogTitle className="text-white">Quick Create Role</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new job position to your recruitment pipeline.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Role Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="bg-muted border-border text-white h-11 rounded-xl focus:ring-brand focus:border-brand"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl text-muted-foreground hover:text-white">
                Cancel
              </Button>
              <Button 
                onClick={() => createRoleMutation.mutate()} 
                disabled={!roleTitle.trim() || createRoleMutation.isPending}
                className="btn-primary-glow rounded-xl px-6"
              >
                {createRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <div className="h-4 w-px bg-border mx-1"></div>
        
        <Button variant="ghost" size="icon" onClick={toggleMode} className="text-muted-foreground hover:text-foreground rounded-full hover:bg-card h-9 w-9">
          <Moon className="h-4 w-4 hidden dark:block" />
          <Sun className="h-4 w-4 block dark:hidden" />
        </Button>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full hover:bg-card h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

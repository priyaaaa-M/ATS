import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'

export const Tabs = TabsPrimitive.Root
export const TabsContent = TabsPrimitive.Content

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn('inline-flex items-center gap-5 overflow-auto', className)} {...props} />
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn('border-b-2 border-transparent pb-3 text-sm text-[var(--text-3)] data-[state=active]:border-[var(--brand)] data-[state=active]:text-[var(--brand)]', className)}
      {...props}
    />
  )
}

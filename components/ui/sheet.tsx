'use client'

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { X as XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        className,
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = 'right',
  title = 'Dialog',
  showHeader = false,
  headerContent,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'top' | 'right' | 'bottom' | 'left'
  title?: string
  showHeader?: boolean // when true render a visible header optimized for mobile
  headerContent?: React.ReactNode
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
          // responsive sizing: full width on xs, constrained on sm+
          side === 'right' &&
            'inset-y-0 right-0 h-full w-full sm:w-3/4 sm:max-w-sm border-l',
          side === 'left' &&
            'inset-y-0 left-0 h-full w-full sm:w-3/4 sm:max-w-sm border-r',
          side === 'top' &&
            'inset-x-0 top-0 h-auto w-full border-b',
          side === 'bottom' &&
            'inset-x-0 bottom-0 h-auto w-full border-t sm:max-h-[70vh]',
          className,
        )}
        {...props}
      >
        {/* Always include an accessible Radix Title (sr-only fallback) */}
        <SheetPrimitive.Title className="sr-only">{title}</SheetPrimitive.Title>

        {/* Visible header optimized for mobile (hamburger / nav sheets) */}
        {showHeader && (
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background/60 sm:hidden">
            <div className="flex items-center gap-3">
              {/* small logo / handle */}
              <div className="w-8 h-8 rounded-md bg-muted-foreground/10 flex items-center justify-center">
                {/* decorative */}
              </div>
              <div className="min-w-0">
                <SheetPrimitive.Title className="text-sm font-semibold text-foreground truncate">
                  {title}
                </SheetPrimitive.Title>
                {headerContent && (
                  <div className="text-xs text-muted-foreground truncate">
                    {headerContent}
                  </div>
                )}
              </div>
            </div>

            {/* mobile close - visible only on small screens (header) */}
            <SheetPrimitive.Close asChild>
              <button
                aria-label="Close"
                className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted-foreground/10 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </SheetPrimitive.Close>
          </div>
        )}

        {/* Top drag handle for bottom sheet (mobile UX) */}
        {side === 'bottom' && (
          <div className="hidden sm:block w-full justify-center pt-2">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        {children}

        {/* Desktop/large-screen close - hidden on mobile when header is used */}
        <SheetPrimitive.Close
          className={cn(
            'ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none',
            showHeader ? 'hidden sm:inline-flex' : 'inline-flex'
          )}
        >
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('text-foreground font-semibold', className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Implementação simples do Drawer sem vaul para compatibilidade com React 19
const DrawerContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

function Drawer({
  children,
  open,
  onOpenChange,
  ...props
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  return (
    <DrawerContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      <div {...props}>{children}</div>
    </DrawerContext.Provider>
  )
}

function DrawerTrigger({
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { setOpen } = React.useContext(DrawerContext)
  return (
    <button
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  )
}

function DrawerPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function DrawerClose({
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { setOpen } = React.useContext(DrawerContext)
  return (
    <button
      onClick={() => setOpen(false)}
      {...props}
    >
      {children}
    </button>
  )
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { open, setOpen } = React.useContext(DrawerContext)
  
  if (!open) return null
  
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 animate-in fade-in-0",
        className
      )}
      onClick={() => setOpen(false)}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open } = React.useContext(DrawerContext)
  
  if (!open) return null
  
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background border-t rounded-t-lg max-h-[80vh] overflow-auto",
          "animate-in slide-in-from-bottom-4",
          className
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 h-2 w-[100px] shrink-0 rounded-full" />
        {children}
      </div>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-0.5 p-4 text-center md:gap-1.5 md:text-left", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}

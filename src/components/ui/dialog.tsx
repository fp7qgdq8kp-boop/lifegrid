"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      className={cn("fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm", className)}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.75rem] border border-white/10 bg-slate-950/95 p-6 shadow-2xl",
          className
        )}
        {...props}
      >
        {children}
        <DialogClose className="absolute right-5 top-5 rounded-full p-1 text-muted-foreground transition hover:bg-white/5 hover:text-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-6 flex flex-col gap-2", className)} {...props} />;
}

function DialogTitle({
  className,
  ...props
}: DialogPrimitive.DialogTitleProps) {
  return <DialogPrimitive.Title className={cn("text-xl font-semibold", className)} {...props} />;
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
};

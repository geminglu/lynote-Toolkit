"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "lynote-ui/sonner";
import { TooltipProvider } from "lynote-ui/tooltip";

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster />
    </ThemeProvider>
  );
}

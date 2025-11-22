import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { getDocsTree } from "@/lib/docs";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";

export default async function DocsLayout({ children }: { children: ReactNode }) {
  const tree = await getDocsTree();

  return (
    <SidebarProvider>
      <AppSidebar tree={tree} />
      <SidebarInset>
        <div className="relative flex h-full flex-col px-4 pt-4 pb-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <SidebarTrigger />
          </div>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

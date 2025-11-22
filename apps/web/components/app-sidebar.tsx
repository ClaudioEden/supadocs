"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@workspace/ui/components/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { ChatModal } from "@/components/chat-modal";

export type SidebarNode = {
  title: string;
  url: string;
  children?: SidebarNode[];
  slug: string[];
};

function isChildActive(node: SidebarNode, pathname: string): boolean {
  if (node.url !== "#" && pathname === node.url) return true;
  if (node.children) {
    return node.children.some((child) => isChildActive(child, pathname));
  }
  return false;
}

function TreeItem({
  node,
  isSub = false,
}: {
  node: SidebarNode;
  isSub?: boolean;
}) {
  const pathname = usePathname();
  const isActive =
    node.url !== "#" && (pathname === node.url);

  const isOpen =
    isActive ||
    (node.children && node.children.some((child) => isChildActive(child, pathname)));

  const ItemComponent = isSub ? SidebarMenuSubItem : SidebarMenuItem;
  const ButtonComponent = isSub ? SidebarMenuSubButton : SidebarMenuButton;

  if (node.children && node.children.length > 0) {
    return (
      <Collapsible defaultOpen={!!isOpen} className="group/collapsible">
        <ItemComponent>
          <CollapsibleTrigger asChild>
            <ButtonComponent>
              {node.title}
              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </ButtonComponent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {node.children.map((child) => (
                <TreeItem
                  key={child.url + child.title}
                  node={child}
                  isSub={true}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </ItemComponent>
      </Collapsible>
    );
  }

  return (
    <ItemComponent>
      <ButtonComponent asChild isActive={isActive}>
        <Link href={node.url}>{node.title}</Link>
      </ButtonComponent>
    </ItemComponent>
  );
}

export function AppSidebar({
  tree,
  ...props
}: React.ComponentProps<typeof Sidebar> & { tree: SidebarNode[] }) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link className="flex flex-row items-center gap-3" href="/" data-testid="sidebar-logo">
                <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                  Supadocs
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ChatModal
              trigger={
                <SidebarMenuButton
                  variant="outline"
                  className="justify-start text-muted-foreground"
                  data-testid="sidebar-search"
                >
                  <Search className="mr-2 size-4" />
                  Search or Ask AI...
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Documentation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tree.map((node) => (
                <TreeItem key={node.url + node.title} node={node} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function getStatusBadge(status: string): string {
  const statusMap: Record<string, string> = {
    active: "bg-brand-green/10 text-brand-green border-brand-green/20",
    inactive: "bg-destructive/10 text-destructive border-destructive/20",
    pending: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    revoked: "bg-destructive/10 text-destructive border-destructive/20"
  };
  
  return statusMap[status.toLowerCase()] || "bg-muted/10 text-muted-foreground border-muted/20";
}

export function getEventStatusBadge(status: string): string {
  const variants: Record<string, string> = {
    active: "bg-brand-green/10 text-brand-green border-brand-green/20",
    completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    draft: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    synced: "bg-brand-green/10 text-brand-green border-brand-green/20",
    error: "bg-destructive/10 text-destructive border-destructive/20"
  };
  
  return variants[status.toLowerCase()] || "bg-muted/10 text-muted-foreground border-muted/20";
}
  
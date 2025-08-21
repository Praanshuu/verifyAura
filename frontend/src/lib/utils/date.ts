export function formatDateTime(dateString: string): string {
    if (!dateString) return "-";
  
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
  
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
  
    return date.toLocaleString("en-IN", options);
  }
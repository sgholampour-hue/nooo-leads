export function calculateUrgency(expirationYear: string): number {
  if (expirationYear === "Unknown") return 0;
  const yearInt = parseInt(expirationYear, 10);
  if (isNaN(yearInt)) return 0;
  const currentYear = new Date().getFullYear();
  const yearsLeft = yearInt - currentYear;
  if (yearsLeft < 0) return 100;
  if (yearsLeft <= 0) return 95;
  if (yearsLeft <= 1) return 90;
  if (yearsLeft <= 2) return 70;
  if (yearsLeft <= 3) return 50;
  return 30;
}

export function getUrgencyLabel(score: number): string {
  if (score >= 90) return "Kritiek";
  if (score >= 70) return "Hoog";
  if (score >= 50) return "Middel";
  if (score > 0) return "Laag";
  return "Onbekend";
}

export function getUrgencyColor(score: number): string {
  if (score >= 90) return "bg-destructive text-destructive-foreground";
  if (score >= 70) return "bg-warning text-warning-foreground";
  if (score >= 50) return "bg-primary text-primary-foreground";
  if (score > 0) return "bg-success text-success-foreground";
  return "bg-muted text-muted-foreground";
}

export function getRowUrgencyClass(score: number): string {
  if (score >= 90) return "border-l-4 border-l-destructive bg-destructive/5";
  if (score >= 70) return "border-l-4 border-l-warning bg-warning/5";
  if (score >= 50) return "border-l-4 border-l-primary bg-primary/5";
  return "";
}

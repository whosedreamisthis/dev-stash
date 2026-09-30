import { Label } from "@/components/ui/label";

interface SettingRowProps {
  // Id of the control in children, so the label points to it
  id: string;
  label: string;
  description: string;
  children: React.ReactNode;
}

// A settings row: label and description on the left, the control on the right
export function SettingRow({ id, label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <Label htmlFor={id} className="font-medium">
          {label}
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

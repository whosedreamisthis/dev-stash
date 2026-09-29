import { Label } from "@/components/ui/label";

interface ItemFormFieldProps {
  id: string;
  label: string;
  error?: string;
  children: (props: {
    id: string;
    autoComplete: "off";
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }) => React.ReactNode;
}

export function ItemFormField({ id, label, error, children }: ItemFormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        // No browser autofill list of past titles and names popping over the dialog
        autoComplete: "off",
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

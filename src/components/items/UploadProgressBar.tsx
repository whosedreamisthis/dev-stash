interface UploadProgressBarProps {
  // Percent, 0–100
  value: number;
}

// A thin primary-colored bar, styled the same in Chrome, Safari and Firefox
export function UploadProgressBar({ value }: UploadProgressBarProps) {
  return (
    <progress
      value={value}
      max={100}
      aria-label="Upload progress"
      className="h-1.5 w-full appearance-none overflow-hidden rounded-full bg-muted [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-[width]"
    />
  );
}

type FeedbackProps = {
  message: string | null;
  variant?: "info" | "error" | "success" | "loading";
  className?: string;
};

export function Feedback({ message, variant = "info", className }: FeedbackProps) {
  if (!message) return null;

  const resolved = variant === "loading" ? "info" : variant;

  return (
    <div
      className={`feedback feedback--${resolved}${variant === "loading" ? " feedback--loading" : ""}${className ? ` ${className}` : ""}`}
      role="status"
    >
      {message}
    </div>
  );
}

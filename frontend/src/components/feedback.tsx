type FeedbackProps = {
  message: string | null;
  variant?: "info" | "error" | "success" | "loading";
};

export function Feedback({ message, variant = "info" }: FeedbackProps) {
  if (!message) return null;

  const resolved = variant === "loading" ? "info" : variant;

  return (
    <div
      className={`feedback feedback--${resolved}${variant === "loading" ? " feedback--loading" : ""}`}
      role="status"
    >
      {message}
    </div>
  );
}

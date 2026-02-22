import type { FC } from "react";

type StepNavigationProps = {
  isFirst: boolean;
  isLast: boolean;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
};

export const StepNavigation: FC<StepNavigationProps> = ({
  isFirst,
  isLast,
  canGoNext,
  onBack,
  onNext,
}) => (
  <footer className="step-navigation">
    <button className="btn btn-secondary" disabled={isFirst} onClick={onBack}>
      ← Back
    </button>
    {!isLast && (
      <button
        className="btn btn-primary"
        onClick={onNext}
        disabled={!canGoNext}
      >
        Next →
      </button>
    )}
  </footer>
);

import React, { type FC } from "react";
import cn from "classnames";

type StepperProps = {
  labels: string[];
  currentStep: number;
  onStepClick: (step: number) => void;
  completedSteps: Set<number>;
};

export const Stepper: FC<StepperProps> = ({
  labels,
  currentStep,
  onStepClick,
  completedSteps,
}) => {
  return (
    <nav className="stepper">
      {labels.map((label, i) => {
        const isCompleted = completedSteps.has(i);
        const isCurrent = i === currentStep;
        const isClickable = isCurrent || isCompleted || i <= Math.max(...completedSteps, 0);

        return (
          <React.Fragment key={label}>
            <button
              className={cn("stepper-item", {
                active: isCurrent && !isCompleted,
                completed: isCompleted,
              })}
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(i)}
            >
              <span className="stepper-number">
                {isCompleted ? "✓" : i + 1}
              </span>
              <span className="stepper-label">{label}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

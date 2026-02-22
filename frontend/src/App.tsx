import { Stepper, AppHeader, StepNavigation } from "./components";
import { useWizard } from "./hooks/useWizard";
import { STEPS } from "./config/steps";

function App() {
  const wizard = useWizard(STEPS.length);
  const { nav } = wizard;

  const stepLabels = STEPS.map((s) => s.label);
  const ActiveStep = STEPS[nav.step];

  return (
    <div className="app">
      <AppHeader />

      <Stepper
        labels={stepLabels}
        currentStep={nav.step}
        onStepClick={nav.goTo}
        completedSteps={nav.completedSteps}
      />

      <main className="main-panel">
        <div className="main-panel-inner">{ActiveStep?.render(wizard)}</div>
      </main>

      <StepNavigation
        isFirst={nav.isFirst}
        isLast={nav.isLast}
        canGoNext={nav.canGoNext}
        onBack={nav.goBack}
        onNext={nav.goNext}
      />
    </div>
  );
}

export default App;

import { useState, useCallback, useMemo } from "react";
import { getValidationError } from "../utils";
import type { Column, MappingEntry } from "../types";

export type WizardState = {
  connectionString: string;
  connectionId: string | null;
  selectedTable: string | null;
  columns: Column[];
  mapping: MappingEntry[];
  webhookUrl: string;
};

type WizardActions = {
  setConnectionString: (v: string) => void;
  handleConnected: (id: string) => void;
  handleTableSelected: (table: string, cols: Column[]) => void;
  handleMappingChange: (mapping: MappingEntry[]) => void;
  setWebhookUrl: (v: string) => void;
  handleWebhookSent: () => void;
};

type StepNav = {
  step: number;
  completedSteps: Set<number>;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  canGoNext: boolean;
  goNext: () => void;
  goBack: () => void;
  goTo: (step: number) => void;
};

export type UseWizardReturn = {
  state: WizardState;
  actions: WizardActions;
  nav: StepNav;
};

export function useWizard(totalSteps: number): UseWizardReturn {
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const [connectionString, setConnectionString] = useState("");
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [mapping, setMapping] = useState<MappingEntry[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");

  const markCompleted = useCallback((s: number) => {
    setCompletedSteps((prev) => new Set([...prev, s]));
  }, []);

  const unmarkCompleted = useCallback((s: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.delete(s);
      return next;
    });
  }, []);

  const handleConnected = useCallback(
    (id: string) => {
      setConnectionId(id);
      markCompleted(0);
    },
    [markCompleted],
  );

  const handleTableSelected = useCallback(
    (table: string, cols: Column[]) => {
      setSelectedTable(table);
      setColumns(cols);
      markCompleted(1);
    },
    [markCompleted],
  );

  const handleMappingChange = useCallback(
    (next: MappingEntry[]) => {
      setMapping(next);
      const valid =
        next.length > 0 &&
        next.every((e, i) => getValidationError(e, i, next) === null);
      if (valid) {
        markCompleted(2);
      } else {
        unmarkCompleted(2);
      }
    },
    [markCompleted, unmarkCompleted],
  );

  const handleWebhookSent = useCallback(() => {
    markCompleted(3);
  }, [markCompleted]);

  const isMappingValid = useMemo(
    () =>
      mapping.length > 0 &&
      mapping.every(
        (entry, i) => getValidationError(entry, i, mapping) === null,
      ),
    [mapping],
  );

  const canGoNext = useMemo((): boolean => {
    switch (step) {
      case 0:
        return connectionId !== null;
      case 1:
        return selectedTable !== null;
      case 2:
        return isMappingValid;
      default:
        return false;
    }
  }, [step, connectionId, selectedTable, isMappingValid]);

  const goNext = useCallback(() => {
    if (canGoNext && step < totalSteps - 1) {
      setStep(step + 1);
    }
  }, [canGoNext, step, totalSteps]);

  const goBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  return {
    state: {
      connectionString,
      connectionId,
      selectedTable,
      columns,
      mapping,
      webhookUrl,
    },
    actions: {
      setConnectionString,
      handleConnected,
      handleTableSelected,
      handleMappingChange,
      setWebhookUrl,
      handleWebhookSent,
    },
    nav: {
      step,
      completedSteps,
      totalSteps,
      isFirst: step === 0,
      isLast: step === totalSteps - 1,
      canGoNext,
      goNext,
      goBack,
      goTo: setStep,
    },
  };
}

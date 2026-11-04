import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation } from "convex/react";
import { makeFunctionReference } from "convex/server";
import { getKinfloConvexRuntime } from "@/lib/kinfloConvexRuntime";

type SubmitLeadInput = {
  siteId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  persona?: string;
  journeyStage?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  consent?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type TransitionLeadStageInput = {
  leadId: string;
  toStageKey: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

type UpdateLeadInput = {
  leadId: string;
  status?: "active" | "converted" | "archived";
  pipelineStageKey?: string;
  assignedTo?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

type AssignLeadInput = {
  leadId: string;
  assignedTo: string;
  assignmentType?: string;
  notes?: string;
};

type CreateTaskInput = {
  siteId: string;
  leadId?: string;
  assignedTo?: string;
  title: string;
  description?: string;
  taskType: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  dueAt?: number;
  metadata?: Record<string, unknown>;
};

type CrmWriteStatus = "blocked" | "ready" | "saving" | "saved" | "error";

type CrmWriteAdapterContextValue = {
  enabled: boolean;
  status: CrmWriteStatus;
  error: string | null;
  activationGate: string;
  submitLead: (input: SubmitLeadInput) => Promise<unknown>;
  transitionLeadStage: (input: TransitionLeadStageInput) => Promise<unknown>;
  updateLead: (input: UpdateLeadInput) => Promise<unknown>;
  assignLead: (input: AssignLeadInput) => Promise<unknown>;
  createTask: (input: CreateTaskInput) => Promise<unknown>;
  clearError: () => void;
};

const submitLeadMutation = makeFunctionReference<"mutation", SubmitLeadInput, unknown>("crm:submitLead");
const transitionLeadStageMutation = makeFunctionReference<"mutation", TransitionLeadStageInput, unknown>("crm:transitionLeadStage");
const updateLeadMutation = makeFunctionReference<"mutation", UpdateLeadInput, unknown>("crm:updateLead");
const assignLeadMutation = makeFunctionReference<"mutation", AssignLeadInput, unknown>("crm:assignLead");
const createTaskMutation = makeFunctionReference<"mutation", CreateTaskInput, unknown>("crm:createTask");

const blockedRuntime = getKinfloConvexRuntime();
const blockedValue: CrmWriteAdapterContextValue = {
  enabled: false,
  status: "blocked",
  error: null,
  activationGate: blockedRuntime.activationGate,
  submitLead: async () => { throw new Error("KinFlo CRM write adapter is disabled"); },
  transitionLeadStage: async () => { throw new Error("KinFlo CRM write adapter is disabled"); },
  updateLead: async () => { throw new Error("KinFlo CRM write adapter is disabled"); },
  assignLead: async () => { throw new Error("KinFlo CRM write adapter is disabled"); },
  createTask: async () => { throw new Error("KinFlo CRM write adapter is disabled"); },
  clearError: () => undefined,
};

const KinfloCrmWriteAdapterContext = createContext<CrmWriteAdapterContextValue>(blockedValue);

export function DisabledKinfloCrmWriteAdapterProvider({ children }: { children: ReactNode }) {
  return (
    <KinfloCrmWriteAdapterContext.Provider value={blockedValue}>
      {children}
    </KinfloCrmWriteAdapterContext.Provider>
  );
}

export function LiveKinfloCrmWriteAdapterProvider({ children }: { children: ReactNode }) {
  const runtime = getKinfloConvexRuntime();
  const submitLead = useMutation(submitLeadMutation);
  const transitionLeadStage = useMutation(transitionLeadStageMutation);
  const updateLead = useMutation(updateLeadMutation);
  const assignLead = useMutation(assignLeadMutation);
  const createTask = useMutation(createTaskMutation);
  const enabled = runtime.canUseLiveData;
  const [status, setStatus] = useState<CrmWriteStatus>(enabled ? "ready" : "blocked");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (operation: () => Promise<unknown>) => {
    if (!enabled) {
      throw new Error("KinFlo CRM write adapter is disabled");
    }
    setStatus("saving");
    setError(null);
    try {
      const result = await operation();
      setStatus("saved");
      return result;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "CRM change could not be saved.";
      setError(message);
      setStatus("error");
      throw cause;
    }
  }, [enabled]);

  const value = useMemo<CrmWriteAdapterContextValue>(() => ({
    enabled,
    status,
    error,
    activationGate: runtime.activationGate,
    submitLead: (input) => run(() => submitLead(input)),
    transitionLeadStage: (input) => run(() => transitionLeadStage(input)),
    updateLead: (input) => run(() => updateLead(input)),
    assignLead: (input) => run(() => assignLead(input)),
    createTask: (input) => run(() => createTask(input)),
    clearError: () => {
      setError(null);
      setStatus(enabled ? "ready" : "blocked");
    },
  }), [assignLead, createTask, enabled, error, run, runtime.activationGate, status, submitLead, transitionLeadStage, updateLead]);

  return (
    <KinfloCrmWriteAdapterContext.Provider value={value}>
      {children}
    </KinfloCrmWriteAdapterContext.Provider>
  );
}

export function useKinfloCrmWriteAdapter() {
  return useContext(KinfloCrmWriteAdapterContext);
}

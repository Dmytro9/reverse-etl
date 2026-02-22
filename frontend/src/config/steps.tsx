import {
  ConnectSource,
  SelectTable,
  MappingEditor,
  Preview,
} from "../components";
import { STEP_LABELS } from "./constants";
import type { StepConfig } from "./constants";

export const STEPS: StepConfig[] = [
  {
    label: STEP_LABELS.SOURCE,
    render: ({ state, actions }) => (
      <ConnectSource
        connectionString={state.connectionString}
        onConnectionStringChange={actions.setConnectionString}
        onConnected={actions.handleConnected}
      />
    ),
  },
  {
    label: STEP_LABELS.TABLE,
    render: ({ state, actions }) =>
      state.connectionId ? (
        <SelectTable
          connectionId={state.connectionId}
          selectedTable={state.selectedTable}
          onTableSelected={actions.handleTableSelected}
        />
      ) : null,
  },
  {
    label: STEP_LABELS.MAPPING,
    render: ({ state, actions }) => (
      <MappingEditor
        columns={state.columns}
        mapping={state.mapping}
        onMappingChange={actions.handleMappingChange}
      />
    ),
  },
  {
    label: STEP_LABELS.PREVIEW,
    render: ({ state, actions }) =>
      state.connectionId && state.selectedTable ? (
        <Preview
          connectionId={state.connectionId}
          table={state.selectedTable}
          mapping={state.mapping}
          webhookUrl={state.webhookUrl}
          onWebhookUrlChange={actions.setWebhookUrl}
          onWebhookSent={actions.handleWebhookSent}
        />
      ) : null,
  },
];

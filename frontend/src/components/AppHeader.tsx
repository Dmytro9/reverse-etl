import type { FC } from "react";

export const AppHeader: FC = () => (
  <header className="app-header">
    <div className="app-header-icon">⇄</div>
    <h1>Reverse ETL</h1>
    <span className="subtitle">Setup Wizard</span>
  </header>
);

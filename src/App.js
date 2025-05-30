import React from "react";
import { Dashboard, ErrorBoundary } from "./components";
import "./App.scss";

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <Dashboard />
      </div>
    </ErrorBoundary>
  );
}

export default App;

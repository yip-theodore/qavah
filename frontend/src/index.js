import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import App from './App'
import ProjectInfo from './pages/ProjectInfo'
import NewProject from './pages/NewProject'

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<Navigate to="/44787" replace />} />
          <Route path=":chainId" element={<App />}>
            <Route path="new" element={<NewProject />} />
            <Route path=":projectId" element={<ProjectInfo />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

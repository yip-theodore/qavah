import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from './App'
import ProjectInfo from './pages/ProjectInfo'
import NewProject from './pages/NewProject'

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          {/* <Route index element={<Home />} /> */}
          <Route path="new" element={<NewProject />} />
          <Route path=":projectId" element={<ProjectInfo />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

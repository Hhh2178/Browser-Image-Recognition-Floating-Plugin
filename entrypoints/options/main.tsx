import React from "react";
import { createRoot } from "react-dom/client";
import { OptionsApp } from "./App";
import "./style.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Options root is missing");
}
createRoot(root).render(<OptionsApp />);

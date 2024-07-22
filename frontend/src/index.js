import 'bootstrap/dist/css/bootstrap.min.css';
import './css/main.css';
import './css/sprite-maptiles.css';
import './css/units.css';
import './css/hud.css';
import './css/responsive.css';
import React from "react";
import SoftWarApp from "./SoftWarApp";
import { createRoot } from "react-dom/client";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<>
    <SoftWarApp/>
</>);
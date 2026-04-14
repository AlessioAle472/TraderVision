import { renderToString } from 'react-dom/server';
import React from 'react';
import { StaticRouter } from 'react-router-dom/server';
import App from './src/App.jsx';

// Simple mock for window
global.window = {};

try {
  const html = renderToString(
    <StaticRouter location="/asset/AAPL">
      <App />
    </StaticRouter>
  );
  console.log("Rendered successfully:", html.substring(0, 100) + "...");
} catch (e) {
  console.error("Render failed:", e);
}

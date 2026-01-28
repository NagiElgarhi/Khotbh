
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Critical error during app initialization:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: sans-serif;">
      <h2>حدث خطأ أثناء تحميل التطبيق</h2>
      <p>يرجى التأكد من أن متصفحك يدعم الميزات الحديثة.</p>
      <button onclick="location.reload()">إعادة تحميل</button>
    </div>
  `;
}

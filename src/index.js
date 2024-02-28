import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // Import your CSS file
import App from './App'; // Import your App component

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root') // Assuming you have a root element in your HTML where you want to render the React app
);

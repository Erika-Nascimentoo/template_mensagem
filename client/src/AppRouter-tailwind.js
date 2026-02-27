import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link
} from 'react-router-dom';
import App from './App-tailwind';
import Templates from './Templates-tailwind';
import TemplateTest from './TemplateTest-tailwind';

function AppRouter() {
  return (
    <Router>
      <nav className="bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
             
              <h1 className="text-xl font-bold">Meta Chat Template</h1>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/"
                className="text-white hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
              >
                <span className="material-symbols-outlined mr-2 text-base">chat</span>
                Chat
              </Link>
              <Link
                to="/templates"
                className="text-white hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
              >
                <span className="material-symbols-outlined mr-2 text-base">content_copy</span>
                Templates
              </Link>
              <Link
                to="/test-template"
                className="text-white hover:bg-primary-dark px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
              >
                <span className="material-symbols-outlined mr-2 text-base">science</span>
                Teste
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/test-template" element={<TemplateTest />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppRouter;

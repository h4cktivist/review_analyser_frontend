import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import InstitutionList from './components/Institutions/InstitutionList';
import EventList from './components/Events/EventList';
import ReviewList from './components/Reviews/ReviewList';
import './App.css';
import ReviewDetail from "./components/Reviews/ReviewDetail";
import InstitutionDetail from "./components/Institutions/InstitutionDetail";
import EventDetail from "./components/Events/EventDetail";

// Компонент для защиты маршрутов
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('access_token');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
      <Router>
        <div className="App">
          <Navbar />

          <Routes>
            {/* Главная страница перенаправляет на учреждения */}
            <Route path="/" element={<Navigate to="/institutions" />} />

            {/* Публичные маршруты */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Защищенные маршруты */}
            <Route
                path="/institutions"
                element={
                  <ProtectedRoute>
                    <InstitutionList />
                  </ProtectedRoute>
                }
            />
            <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <EventList />
                  </ProtectedRoute>
                }
            />
            <Route
                path="/reviews"
                element={
                  <ProtectedRoute>
                    <ReviewList />
                  </ProtectedRoute>
                }
            />
            <Route
                path="/reviews/:id"
                element={
                    <ProtectedRoute>
                      <ReviewDetail />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/institutions/:id"
                element={
                  <ProtectedRoute>
                    <InstitutionDetail />
                  </ProtectedRoute>
                  }
            />
              <Route
                  path="/events/:id"
                  element={
                      <ProtectedRoute>
                          <EventDetail />
                      </ProtectedRoute>
                  }
              />
          </Routes>
        </div>
      </Router>
  );
}

export default App;

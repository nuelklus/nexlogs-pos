'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

function DashboardContent() {
  const { user } = useAuth();

  // Render different dashboards based on user role
  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  // For CUSTOMER and PRO_CONTRACTOR roles
  return <CustomerDashboard />;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

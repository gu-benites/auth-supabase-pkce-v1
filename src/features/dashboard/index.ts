// src/features/dashboard/index.ts
export * from './layout'; // Exports DashboardLayout from ./layout/index.ts
// No longer exports from ./components directly at this top level.
// Specific components like DashboardHeader, DashboardSidebar, DashboardUserMenu
// are now typically imported directly or via '@/features/dashboard/components'.

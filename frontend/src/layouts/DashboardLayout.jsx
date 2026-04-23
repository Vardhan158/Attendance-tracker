import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const DashboardLayout = ({ children }) => (
  <div className="min-h-screen bg-slate-50 lg:flex">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">{children}</main>
    </div>
  </div>
);

export default DashboardLayout;

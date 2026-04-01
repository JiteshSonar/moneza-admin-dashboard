"use client";
import "./globals.css";
import Sidebar from "../components/sidebar";
import Topbar from "../components/topbar";
import { Toaster } from "react-hot-toast";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const noLayoutPaths = ["/login", "/register"];

  const hideLayout = noLayoutPaths.includes(pathname);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, []);

  return (
    <html lang="en">
      <body className="flex bg-gray-50">
        {!hideLayout && <Sidebar />}
        <div
          className={`flex min-h-screen flex-1 flex-col ${
            hideLayout ? "" : "ml-[200px]"
          }`}
        >
          {!hideLayout && <Topbar />}
          <main className="p-2 pt-20">{children}</main>
          <Toaster position="bottom-center" />
        </div>
      </body>
    </html>
  );
}

"use client";
import{LogOut}from"lucide-react";import{useRouter}from"next/navigation";
export function LogoutButton(){const router=useRouter();return<button onClick={async()=>{await fetch("/api/admin/logout",{method:"POST"});router.replace("/admin/login");router.refresh()}} className="mt-4 flex items-center gap-2 text-sm font-semibold text-orange-300 hover:text-orange-200"><LogOut size={17}/>Logout</button>}

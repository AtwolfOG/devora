"use client"
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import axios from "axios";

type UserDetails = {
	username: string;
	email: string;
	profile_picture_url: string;
}

export default function UserDetails() {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get<UserDetails>(`/api/users/profile`);
      setUser(res.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data.error || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);
  if (loading) {
    return <div><Loader2 className="animate-spin text-(--text-secondary)" /></div>;
  }
  if (error) {
    return <div className="text-(--text-secondary)">
      <p>Failed to load user details</p>
      <p className="text-(--text-secondary) hover:underline cursor-pointer" onClick={fetchData}>Retry</p>
      </div>
  }
    return (
      user && (
        <div className="flex flex-col items-center justify-center my-4  gap-4">
            <div className="m-auto overflow-hidden"><img className="rounded-full" width={100} height={100} src={user.profile_picture_url} alt="" /></div>
            <div className="text-center">
              <p className="text-2xl! font-semibold">{user.username}</p>
              <p className="text-sm! text-(--text-secondary)">{user.email}</p>
            </div>
        </div>
      )
    )
}
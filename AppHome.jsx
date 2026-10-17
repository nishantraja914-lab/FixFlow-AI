import { Navigate } from "react-router-dom";
import { useCurrentUser } from "@/lib/useCurrentUser";

export default function AppHome() {
  const { role } = useCurrentUser();
  const dest = role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/reporter";
  return <Navigate to={dest} replace />;
}

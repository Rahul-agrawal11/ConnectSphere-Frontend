import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function LoginSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");

    if (token && userId) {
      localStorage.setItem("jwt_token", token);
      localStorage.setItem("user_id", userId);
      navigate("/feed", { replace: true });
    } else {
      navigate("/login?error=oauth2", { replace: true });
    }
  }, [searchParams, navigate]);

  return <div>Logging you in…</div>;
}
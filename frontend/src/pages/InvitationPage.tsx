import { API_BASE_URL } from "../lib/api";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function InvitationPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      navigate("/login", { replace: true });
      return;
    }

    if (!userId) {
      navigate("/", { replace: true });
      return;
    }

    fetch(`${API_BASE_URL}/api/organizations/user/${user.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load organizations");
        return res.json();
      })
      .then((data) => {
        const orgs = data.organizations || [];
        if (orgs.length > 0) {
          navigate(`/organization/${orgs[0].id}/invite?candidateId=${userId}`, { replace: true });
        } else {
          alert("You must create or join an organization before you can invite team members.");
          navigate("/create-organization", { replace: true });
        }
      })
      .catch((err) => {
        setError("Failed to load organization workspace. Please try again.");
      });
  }, [userId, user?.id, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1E9] text-[#242427]">
      <div className="flex flex-col items-center gap-3">
        {error ? (
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold text-[#B44A4A]">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-[5px] bg-[#4963C8] px-4 py-2 text-xs font-semibold text-white"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-[#4963C8]" />
            <p className="text-xs font-medium text-[#7E7C77]">Directing to invitation workspace...</p>
          </>
        )}
      </div>
    </div>
  );
}

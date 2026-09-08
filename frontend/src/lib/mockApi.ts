import { API_BASE_URL } from "./api";
/**
 * Organization API service connecting to PostgreSQL backend
 */
export interface CreateOrganizationRequest {
  name: string;
  brief?: string;
  description?: string;
  size?: string;
  position: string;
  userId?: string;
}

export interface CreateOrganizationResponse {
  organizationId: string;
  name: string;
  brief?: string;
  ownerId: string;
  employeeCount: number;
  createdAt: string;
}

export async function createOrganizationAPI(
  data: CreateOrganizationRequest
): Promise<CreateOrganizationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/organizations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || "Failed to create organization");
  }

  const json = await res.json();
  const org = json.organization;

  return {
    organizationId: org.id,
    name: org.name,
    brief: org.brief,
    ownerId: org.owner_id || data.userId || "",
    employeeCount: org.employeeCount || 1,
    createdAt: org.createdAt || new Date().toISOString(),
  };
}

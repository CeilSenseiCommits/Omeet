import {
  currentUser,
  dbOrganizations,
  dbOrganizationEmployees,
  organizationDetails,
  organizationHierarchy,
} from "./mockData";

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

/**
 * Creates an organization in PostgreSQL database via backend API:
 * 1. Inserts a new record into `organizations` with brief, description, size, employee_count = 1.
 * 2. Inserts a new record into `organization_employees` for the creator with role = 'OWNER'.
 * Falls back to local memory store if backend is unreachable.
 */
export async function createOrganizationAPI(
  data: CreateOrganizationRequest
): Promise<CreateOrganizationResponse> {
  const creatorUserId = data.userId || currentUser.id;
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const nowIso = new Date().toISOString();

  // 1. Try real PostgreSQL backend
  try {
    const res = await fetch("http://localhost:5000/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        brief: data.brief,
        description: data.description,
        size: data.size,
        position: data.position,
        userId: creatorUserId,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const org = json.organization;

      const initials = org.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "OR";

      // Sync with local store so all client UI views work seamlessly
      const newDbOrg = {
        id: org.id,
        name: org.name,
        brief: org.brief,
        description: org.description || org.brief || "",
        size: org.size || "1-10 employees",
        employeeCount: org.employeeCount || 1,
        ownerId: creatorUserId,
        initials,
        accent: "bg-blue-500/20 text-blue-200",
      };
      dbOrganizations.unshift(newDbOrg);

      dbOrganizationEmployees.unshift({
        id: json.membership?.id || `emp_${Date.now()}`,
        organizationId: org.id,
        userId: creatorUserId,
        position: data.position,
        role: "OWNER" as const,
        employmentType: "Full-time",
        salary: 0,
        joiningDate: nowIso.split("T")[0],
        lastAccessedAt: "Just now",
        status: "ACTIVE" as const,
      });

      organizationDetails.unshift({
        id: org.id,
        name: org.name,
        initials,
        accent: "bg-blue-500/20 text-blue-200",
        memberCount: 1,
        activeMeetings: 0,
        status: "Active",
        description: org.description || org.brief || "Workspace",
        hierarchy: organizationHierarchy,
        aiSummary: org.brief || "Workspace created successfully.",
      });

      return {
        organizationId: org.id,
        name: org.name,
        brief: org.brief,
        ownerId: creatorUserId,
        employeeCount: org.employeeCount || 1,
        createdAt: org.createdAt || nowIso,
      };
    } else {
      const errJson = await res.json().catch(() => ({}));
      console.warn("Backend error creating organization:", errJson);
    }
  } catch (backendErr) {
    console.warn("Backend API unavailable, falling back to local state:", backendErr);
  }

  // 2. Fallback to in-memory state
  const newOrgId = `org_${slug || "workspace"}_${Date.now().toString(36).slice(-4)}`;
  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "OR";

  const newDbOrg = {
    id: newOrgId,
    name: data.name,
    brief: data.brief,
    description: data.description || data.brief || "",
    size: data.size || "1-10 employees",
    employeeCount: 1,
    ownerId: creatorUserId,
    initials,
    accent: "bg-blue-500/20 text-blue-200",
  };
  dbOrganizations.unshift(newDbOrg);

  dbOrganizationEmployees.unshift({
    id: `emp_${Date.now()}`,
    organizationId: newOrgId,
    userId: creatorUserId,
    position: data.position,
    role: "OWNER" as const,
    employmentType: "Full-time",
    salary: 0,
    joiningDate: nowIso.split("T")[0],
    lastAccessedAt: "Just now",
    status: "ACTIVE" as const,
  });

  organizationDetails.unshift({
    id: newOrgId,
    name: data.name,
    initials,
    accent: "bg-blue-500/20 text-blue-200",
    memberCount: 1,
    activeMeetings: 0,
    status: "Active",
    description: data.description || data.brief || "Workspace",
    hierarchy: organizationHierarchy,
    aiSummary: data.brief || "Workspace created successfully.",
  });

  return {
    organizationId: newOrgId,
    name: data.name,
    brief: data.brief,
    ownerId: creatorUserId,
    employeeCount: 1,
    createdAt: nowIso,
  };
}

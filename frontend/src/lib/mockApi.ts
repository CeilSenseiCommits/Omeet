import { currentUser } from "./mockData";

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  position: string;
  department?: string;
}

export interface CreateOrganizationResponse {
  organizationId: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

/**
 * Mock API call to create an organization.
 * In the future, this will be replaced by a real POST /api/organizations.
 * The backend will determine the userId from the authenticated request.
 */
export async function createOrganizationAPI(
  data: CreateOrganizationRequest
): Promise<CreateOrganizationResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock generating a unique organization ID
      const newOrgId = `org_${Math.random().toString(36).substring(2, 9)}`;

      resolve({
        organizationId: newOrgId,
        name: data.name,
        // Using the dummy current user ID to represent the backend resolving the creator
        ownerId: currentUser.id,
        createdAt: new Date().toISOString(),
      });
    }, 1000);
  });
}

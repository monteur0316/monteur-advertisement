export type OrgType = "master" | "distributor" | "agency" | "advertiser"

declare global {
  interface CustomJwtSessionClaims {
    orgType?: OrgType
  }

  interface OrganizationPublicMetadata {
    orgType: OrgType
  }

  interface UserPublicMetadata {
    // reserved for future use
  }
}

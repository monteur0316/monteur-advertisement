/**
 * Migration script: Migrate from superAdmin + orgType(advertiser|agency)
 * to hierarchical organization structure (master > distributor > agency > advertiser)
 *
 * Usage: npx tsx scripts/migrate-to-hierarchy.ts
 *
 * Prerequisites:
 * - .env.local must contain TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, CLERK_SECRET_KEY
 * - Run drizzle-kit push first to create the organization_hierarchy table
 *
 * What this script does:
 * 1. Creates a master organization in Clerk (if not exists)
 * 2. Moves current superAdmin users to the master org
 * 3. Populates organization_hierarchy table for all existing orgs
 * 4. Clears superAdmin metadata from users
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { createClerkClient } from "@clerk/backend"
import { organizationHierarchy } from "../src/db/schema/organization-hierarchy"
import { eq } from "drizzle-orm"

const MASTER_ORG_NAME = "Monteur Master"

async function main() {
  console.log("Starting migration to hierarchical organization structure...\n")

  // Initialize clients
  const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
  })

  const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const db = drizzle(tursoClient)

  // Step 1: Find or create master organization
  console.log("Step 1: Setting up master organization...")
  const allOrgs = await clerkClient.organizations.getOrganizationList({ limit: 100 })

  let masterOrg = allOrgs.data.find((org) => {
    const metadata = org.publicMetadata as { orgType?: string }
    return metadata?.orgType === "master"
  })

  if (!masterOrg) {
    // Find a superAdmin user to be the creator
    const users = await clerkClient.users.getUserList({ limit: 100 })
    const superAdminUser = users.data.find(
      (u) => (u.publicMetadata as { superAdmin?: boolean })?.superAdmin === true
    )

    if (!superAdminUser) {
      console.error("ERROR: No superAdmin user found to create master org.")
      console.error("Please manually create a master org or set a user as superAdmin first.")
      process.exit(1)
    }

    masterOrg = await clerkClient.organizations.createOrganization({
      name: MASTER_ORG_NAME,
      createdBy: superAdminUser.id,
    })

    await clerkClient.organizations.updateOrganizationMetadata(masterOrg.id, {
      publicMetadata: { orgType: "master" },
    })

    console.log(`  Created master org: ${masterOrg.name} (${masterOrg.id})`)
  } else {
    console.log(`  Found existing master org: ${masterOrg.name} (${masterOrg.id})`)
  }

  // Step 2: Move superAdmin users to master org
  console.log("\nStep 2: Moving superAdmin users to master org...")
  const allUsers = await clerkClient.users.getUserList({ limit: 100 })
  const superAdmins = allUsers.data.filter(
    (u) => (u.publicMetadata as { superAdmin?: boolean })?.superAdmin === true
  )

  for (const user of superAdmins) {
    try {
      // Check if already a member
      const memberships = await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: masterOrg.id,
      })
      const alreadyMember = memberships.data.some(
        (m) => m.publicUserData?.userId === user.id
      )

      if (!alreadyMember) {
        await clerkClient.organizations.createOrganizationMembership({
          organizationId: masterOrg.id,
          userId: user.id,
          role: "org:member",
        })
        console.log(`  Added user ${user.emailAddresses[0]?.emailAddress} to master org`)
      } else {
        console.log(`  User ${user.emailAddresses[0]?.emailAddress} already in master org`)
      }
    } catch (err) {
      console.error(`  Failed to add user ${user.id}:`, err)
    }
  }

  // Step 3: Populate organization_hierarchy table
  console.log("\nStep 3: Populating organization_hierarchy table...")
  const refreshedOrgs = await clerkClient.organizations.getOrganizationList({ limit: 100 })

  for (const org of refreshedOrgs.data) {
    const metadata = org.publicMetadata as { orgType?: string }
    const orgType = metadata?.orgType ?? null

    // Check if already in hierarchy table
    const existing = await db
      .select()
      .from(organizationHierarchy)
      .where(eq(organizationHierarchy.clerkOrgId, org.id))
      .get()

    if (existing) {
      console.log(`  Skipping ${org.name} (already in hierarchy)`)
      continue
    }

    let depth = 0
    let parentId: string | null = null

    if (orgType === "master") {
      depth = 0
      parentId = null
    } else {
      // Non-master orgs default to master as parent
      depth = orgType === "distributor" ? 1 : orgType === "agency" ? 2 : orgType === "advertiser" ? 3 : 1
      parentId = masterOrg.id

      // If org doesn't have an orgType yet, assign based on old type or default to advertiser
      if (!orgType) {
        await clerkClient.organizations.updateOrganizationMetadata(org.id, {
          publicMetadata: { orgType: "advertiser" },
        })
        console.log(`  Set orgType=advertiser for ${org.name}`)
      }
    }

    const finalOrgType = (orgType ?? "advertiser") as "master" | "distributor" | "agency" | "advertiser"
    await db.insert(organizationHierarchy).values({
      clerkOrgId: org.id,
      orgType: finalOrgType,
      parentClerkOrgId: parentId,
      depth,
    })

    console.log(`  Added ${org.name} (${orgType ?? "advertiser"}, depth=${depth})`)
  }

  // Step 4: Clear superAdmin metadata from users
  console.log("\nStep 4: Clearing superAdmin metadata from users...")
  for (const user of superAdmins) {
    try {
      await clerkClient.users.updateUserMetadata(user.id, {
        publicMetadata: {},
      })
      console.log(`  Cleared superAdmin for ${user.emailAddresses[0]?.emailAddress}`)
    } catch (err) {
      console.error(`  Failed to clear metadata for ${user.id}:`, err)
    }
  }

  // Step 5: Flatten all org roles to org:member
  console.log("\nStep 5: Flattening org roles to org:member...")
  for (const org of refreshedOrgs.data) {
    try {
      const memberships = await clerkClient.organizations.getOrganizationMembershipList({
        organizationId: org.id,
      })
      for (const membership of memberships.data) {
        if (membership.role !== "org:member") {
          await clerkClient.organizations.updateOrganizationMembership({
            organizationId: org.id,
            userId: membership.publicUserData?.userId ?? "",
            role: "org:member",
          })
          console.log(`  Flattened role for user in ${org.name}`)
        }
      }
    } catch (err) {
      console.error(`  Failed to flatten roles for ${org.name}:`, err)
    }
  }

  console.log("\nMigration complete!")
  console.log("\nSummary:")
  console.log(`  Master org: ${masterOrg.name} (${masterOrg.id})`)
  console.log(`  SuperAdmins migrated: ${superAdmins.length}`)
  console.log(`  Total organizations: ${refreshedOrgs.data.length}`)
  console.log("\nIMPORTANT: Update your Clerk JWT template to remove 'superAdmin' claim.")

  process.exit(0)
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})

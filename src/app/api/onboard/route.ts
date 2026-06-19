import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Organization } from "@/models/Organization";

export async function POST(request: Request) {
  try {
    // 1. Establish the database connection using the singleton
    await connectDB();

    // 2. Extract and parse data from the incoming client request
    const body = await request.json();
    const { companyName } = body;

    if (!companyName || companyName.trim() === "") {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 },
      );
    }

    // 3. Insert the new organization record into MongoDB
    const newOrg = await Organization.create({
      name: companyName.trim(),
    });

    // 4. Return the generated metadata to the user
    return NextResponse.json(
      {
        success: true,
        message: "Organization onboarded successfully",
        orgId: newOrg._id,
        name: newOrg.name,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Onboarding Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}

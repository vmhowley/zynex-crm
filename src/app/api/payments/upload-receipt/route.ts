import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id, account_role")
    .eq("user_id", user.id)
    .single();

  if (!profile?.account_id) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  // Check if user has permission (owner or admin)
  if (profile.account_role !== "owner" && profile.account_role !== "admin") {
    return NextResponse.json(
      { error: "Only owners and admins can upload receipts" },
      { status: 403 }
    );
  }

  // Get the form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const paymentRequestId = formData.get("payment_request_id") as string | null;

  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de archivo no permitido. Usa JPEG, PNG, WebP o PDF." },
      { status: 400 }
    );
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "El archivo excede el límite de 10MB" },
      { status: 400 }
    );
  }

  try {
    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `account-${profile.account_id}/${fileName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("payment-receipts")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo: " + uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("payment-receipts")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update payment request with receipt URL if payment_request_id provided
    if (paymentRequestId) {
      const { error: updateError } = await supabase
        .from("payment_requests")
        .update({
          proof_image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentRequestId)
        .eq("account_id", profile.account_id);

      if (updateError) {
        console.error("Update error:", updateError);
        // File was uploaded but update failed - still return success
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      file_name: fileName,
      payment_request_id: paymentRequestId,
    });
  } catch (error) {
    console.error("Upload exception:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

import { supabase, ensureSupabaseFirebaseRoleClaim } from "@/supabase";

export interface Vendor {
    id: string;
    vendorId: string;
    vendorName: string;
    contact: string;
    website: string;
    note: string;
    createdBy: string;
    updatedBy: string;
    createdAt: number;
    updatedAt: number;
}

export interface FetchVendorsPageOptions {
    page: number;
    pageSize: number;
    keyword?: string;
    country?: "all" | "TW" | "CN";
}

export interface VendorPageResult {
    items: Vendor[];
    total: number;
}

interface VendorRow {
    id: string;
    firebase_id: string | null;
    vendor_id: string;
    vendor_name: string;
    contact: string | null;
    website: string | null;
    note: string | null;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
}

interface UpsertVendorInput {
    id: string;
    firebaseId?: string | null;
    vendorId: string;
    vendorName: string;
    contact?: string;
    website?: string;
    note?: string;
    createdBy: string;
    updatedBy: string;
    createdAt: number;
    updatedAt: number;
}

function toVendor(row: VendorRow): Vendor {
    return {
        id: row.id,
        vendorId: row.vendor_id,
        vendorName: row.vendor_name,
        contact: row.contact ?? "",
        website: row.website ?? "",
        note: row.note ?? "",
        createdBy: row.created_by,
        updatedBy: row.updated_by,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
    };
}

function toVendorRow(input: UpsertVendorInput) {
    return {
        id: input.id,
        firebase_id: input.firebaseId ?? input.id,
        vendor_id: input.vendorId,
        vendor_name: input.vendorName,
        contact: input.contact?.trim() ?? "",
        website: input.website?.trim() ?? "",
        note: input.note?.trim() ?? "",
        created_by: input.createdBy,
        updated_by: input.updatedBy,
        created_at: new Date(input.createdAt).toISOString(),
        updated_at: new Date(input.updatedAt).toISOString(),
    };
}

function sortVendorList(list: Vendor[]) {
    return [...list].sort((a, b) => {
        const idA = isNaN(Number(a.vendorId)) ? a.vendorId : Number(a.vendorId);
        const idB = isNaN(Number(b.vendorId)) ? b.vendorId : Number(b.vendorId);
        return idA > idB ? 1 : idA < idB ? -1 : 0;
    });
}

export async function fetchVendorsPage(options: FetchVendorsPageOptions): Promise<VendorPageResult> {
    await ensureSupabaseFirebaseRoleClaim();

    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, options.pageSize || 10);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const keyword = options.keyword?.trim();

    let query = supabase
        .from("vendors")
        .select(
            "id, firebase_id, vendor_id, vendor_name, contact, website, note, created_by, updated_by, created_at, updated_at",
            { count: "exact" }
        );

    if (keyword) {
        query = query.or(`vendor_id.ilike.%${keyword}%,vendor_name.ilike.%${keyword}%`);
    }

    if (options.country === "TW") {
        query = query.ilike("vendor_id", "TW%");
    } else if (options.country === "CN") {
        query = query.ilike("vendor_id", "CN%");
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
        throw error;
    }

    return {
        items: sortVendorList((data satisfies VendorRow[]).map(toVendor)),
        total: count ?? 0,
    };
}

export async function insertVendor(input: UpsertVendorInput) {
    await ensureSupabaseFirebaseRoleClaim();

    const { data, error } = await supabase
        .from("vendors")
        .insert(toVendorRow(input))
        .select(
            "id, firebase_id, vendor_id, vendor_name, contact, website, note, created_by, updated_by, created_at, updated_at"
        )
        .single();

    if (error) {
        throw error;
    }

    return toVendor(data satisfies VendorRow);
}

export async function updateVendor(input: UpsertVendorInput) {
    await ensureSupabaseFirebaseRoleClaim();

    const { data, error } = await supabase
        .from("vendors")
        .update(toVendorRow(input))
        .eq("id", input.id)
        .select(
            "id, firebase_id, vendor_id, vendor_name, contact, website, note, created_by, updated_by, created_at, updated_at"
        )
        .single();

    if (error) {
        throw error;
    }

    return toVendor(data satisfies VendorRow);
}

export async function deleteVendorById(id: string) {
    await ensureSupabaseFirebaseRoleClaim();

    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) {
        throw error;
    }
}

import { ensureSupabaseFirebaseRoleClaim, supabase } from "@/supabase";

export interface Product {
    id: string;
    gtin: string;
    code: string;
    name: string;
    price: number;
    sellingPrice: number;
    cost: number;
    stock: number;
    supplierName: string;
    supplierCode: string;
    imageUrl?: string;
    website?: string;
    note?: string;
    created: number;
    updated?: number;
    createdBy?: string;
    updatedBy?: string;
}

interface ProductRow {
    id: string;
    firebase_id: string | null;
    gtin: string | null;
    code: string;
    name: string;
    price: number;
    selling_price: number;
    cost: number;
    stock: number;
    supplier_name: string;
    supplier_code: string;
    image_url: string | null;
    website: string | null;
    note: string | null;
    created_ms: number;
    updated_ms: number | null;
    created_by: string | null;
    updated_by: string | null;
}

export interface UpsertProductInput {
    id: string;
    firebaseId?: string | null;
    gtin: string;
    code: string;
    name: string;
    price: number;
    sellingPrice: number;
    cost: number;
    stock: number;
    supplierName: string;
    supplierCode: string;
    imageUrl?: string;
    website?: string;
    note?: string;
    created: number;
    updated?: number;
    createdBy?: string;
    updatedBy?: string;
}

export interface FetchProductsPageOptions {
    page: number;
    pageSize: number;
    keyword?: string;
    supplierCode?: string | null;
    sortProp?: string | null;
    sortOrder?: "ascending" | "descending" | null;
}

export interface ProductPageResult {
    items: Product[];
    total: number;
}

function toProduct(row: ProductRow): Product {
    return {
        id: row.id,
        gtin: row.gtin ?? "",
        code: row.code,
        name: row.name,
        price: Number(row.price ?? 0),
        sellingPrice: Number(row.selling_price ?? 0),
        cost: Number(row.cost ?? 0),
        stock: Number(row.stock ?? 0),
        supplierName: row.supplier_name ?? "",
        supplierCode: row.supplier_code ?? "",
        imageUrl: row.image_url ?? "",
        website: row.website ?? "",
        note: row.note ?? "",
        created: Number(row.created_ms ?? 0),
        updated: row.updated_ms ?? undefined,
        createdBy: row.created_by ?? undefined,
        updatedBy: row.updated_by ?? undefined,
    };
}

function normalizeNullableText(value?: string | null) {
    const trimmed = value?.trim() ?? "";
    return trimmed ? trimmed : null;
}

function toProductRow(input: UpsertProductInput) {
    return {
        id: input.id,
        firebase_id: input.firebaseId ?? input.id,
        gtin: normalizeNullableText(input.gtin),
        code: input.code.trim(),
        name: input.name.trim(),
        price: Number(input.price ?? 0),
        selling_price: Number(input.sellingPrice ?? 0),
        cost: Number(input.cost ?? 0),
        stock: Number(input.stock ?? 0),
        supplier_name: input.supplierName?.trim() ?? "",
        supplier_code: input.supplierCode?.trim() ?? "",
        image_url: input.imageUrl?.trim() ?? "",
        website: input.website?.trim() ?? "",
        note: input.note?.trim() ?? "",
        created_ms: Number(input.created ?? Date.now()),
        updated_ms: input.updated == null ? null : Number(input.updated),
        created_by: input.createdBy ?? null,
        updated_by: input.updatedBy ?? null,
    };
}

const productSelectColumns =
    "id, firebase_id, gtin, code, name, price, selling_price, cost, stock, supplier_name, supplier_code, image_url, website, note, created_ms, updated_ms, created_by, updated_by";

function applyProductSort(query: any, sortProp?: string | null, sortOrder?: "ascending" | "descending" | null) {
    const columnMap: Record<string, string> = {
        gtin: "gtin",
        code: "code",
        name: "name",
        price: "price",
        sellingPrice: "selling_price",
        cost: "cost",
        stock: "stock",
        supplierName: "supplier_name",
        supplierCode: "supplier_code",
        created: "created_ms",
        updated: "updated_ms",
    };

    const column = sortProp ? columnMap[sortProp] : null;
    if (column) {
        return query.order(column, { ascending: sortOrder === "ascending", nullsFirst: false });
    }

    return query.order("created_ms", { ascending: false });
}

export async function fetchProducts() {
    await ensureSupabaseFirebaseRoleClaim();

    const { data, error } = await supabase.from("products").select(productSelectColumns);
    if (error) {
        throw error;
    }

    return (data satisfies ProductRow[]).map(toProduct);
}

export async function fetchProductsPage(options: FetchProductsPageOptions): Promise<ProductPageResult> {
    await ensureSupabaseFirebaseRoleClaim();

    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, options.pageSize || 10);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const keyword = options.keyword?.trim();

    let query: any = supabase.from("products").select(productSelectColumns, { count: "exact" });

    if (keyword) {
        query = query.or(`name.ilike.%${keyword}%,code.ilike.%${keyword}%`);
    }

    if (options.supplierCode) {
        query = query.eq("supplier_code", options.supplierCode);
    }

    query = applyProductSort(query, options.sortProp, options.sortOrder);

    const { data, error, count } = await query.range(from, to);
    if (error) {
        throw error;
    }

    return {
        items: (data satisfies ProductRow[]).map(toProduct),
        total: count ?? 0,
    };
}

export async function checkProductCodeExists(code: string, excludeId?: string) {
    await ensureSupabaseFirebaseRoleClaim();

    let query = supabase.from("products").select("id", { count: "exact", head: true }).ilike("code", code.trim());
    if (excludeId) {
        query = query.neq("id", excludeId);
    }

    const { error, count } = await query;
    if (error) {
        throw error;
    }

    return (count ?? 0) > 0;
}

export async function checkProductGtinExists(gtin: string, excludeId?: string) {
    await ensureSupabaseFirebaseRoleClaim();

    let query = supabase.from("products").select("id", { count: "exact", head: true }).eq("gtin", gtin.trim());
    if (excludeId) {
        query = query.neq("id", excludeId);
    }

    const { error, count } = await query;
    if (error) {
        throw error;
    }

    return (count ?? 0) > 0;
}

export async function findExistingProductsByCodesOrGtins(codes: string[], gtins: string[]) {
    await ensureSupabaseFirebaseRoleClaim();

    const normalizedCodes = [...new Set(codes.map((item) => item.trim()).filter(Boolean))];
    const normalizedGtins = [...new Set(gtins.map((item) => item.trim()).filter(Boolean))];

    const [codeResult, gtinResult] = await Promise.all([
        normalizedCodes.length
            ? supabase.from("products").select("code").in("code", normalizedCodes)
            : Promise.resolve({ data: [], error: null }),
        normalizedGtins.length
            ? supabase.from("products").select("gtin").in("gtin", normalizedGtins)
            : Promise.resolve({ data: [], error: null }),
    ]);

    if (codeResult.error) {
        throw codeResult.error;
    }

    if (gtinResult.error) {
        throw gtinResult.error;
    }

    return {
        codes: new Set((codeResult.data ?? []).map((row: { code: string }) => row.code.trim().toLowerCase())),
        gtins: new Set(
            (gtinResult.data ?? [])
                .map((row: { gtin: string | null }) => row.gtin?.trim().toLowerCase())
                .filter((value): value is string => Boolean(value))
        ),
    };
}

export async function insertProduct(input: UpsertProductInput) {
    await ensureSupabaseFirebaseRoleClaim();

    const { data, error } = await supabase
        .from("products")
        .insert(toProductRow(input))
        .select(productSelectColumns)
        .single();

    if (error) {
        throw error;
    }

    return toProduct(data satisfies ProductRow);
}

export async function updateProduct(input: UpsertProductInput) {
    await ensureSupabaseFirebaseRoleClaim();

    const { data, error } = await supabase
        .from("products")
        .update(toProductRow(input))
        .eq("id", input.id)
        .select(productSelectColumns)
        .single();

    if (error) {
        throw error;
    }

    return toProduct(data satisfies ProductRow);
}

export async function upsertProducts(inputs: UpsertProductInput[]) {
    if (!inputs.length) return [];

    await ensureSupabaseFirebaseRoleClaim();

    const { data, error } = await supabase
        .from("products")
        .upsert(inputs.map(toProductRow), { onConflict: "id" })
        .select(productSelectColumns);

    if (error) {
        throw error;
    }

    return (data satisfies ProductRow[]).map(toProduct);
}

export async function deleteProductsByIds(ids: string[]) {
    if (!ids.length) return;

    await ensureSupabaseFirebaseRoleClaim();

    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) {
        throw error;
    }
}

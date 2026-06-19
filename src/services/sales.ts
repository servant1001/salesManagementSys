import { ensureSupabaseFirebaseRoleClaim, supabase } from "@/supabase";

export interface SaleItem {
    barcode: string;
    gtin: string;
    code: string;
    name: string;
    price: number;
    sellingPrice: number;
    quantity: number;
    cost?: number;
    supplierName?: string;
    supplierCode?: string;
    imageUrl?: string;
    website?: string;
    estimatedProfit?: number;
}

export interface Sale {
    id: string;
    timestamp: number;
    total: number;
    totalProfit?: number;
    items: SaleItem[];
    operator: string;
    paymentMethod?: string;
    updater?: string;
}

interface SaleRow {
    id: string;
    firebase_id: string | null;
    timestamp_ms: number;
    total: number;
    total_profit: number | null;
    items: SaleItem[] | null;
    operator: string | null;
    payment_method: string | null;
    updater: string | null;
    created_at: string;
    updated_at: string;
}

export interface UpsertSaleInput {
    id: string;
    firebaseId?: string | null;
    timestamp: number;
    total: number;
    totalProfit?: number;
    items: SaleItem[];
    operator: string;
    paymentMethod?: string;
    updater?: string;
}

function normalizeSaleItem(item: SaleItem): SaleItem {
    return {
        barcode: item.barcode ?? "",
        gtin: item.gtin ?? "",
        code: item.code ?? "",
        name: item.name ?? "",
        price: Number(item.price ?? 0),
        sellingPrice: Number(item.sellingPrice ?? 0),
        quantity: Number(item.quantity ?? 0),
        cost: item.cost == null ? undefined : Number(item.cost),
        supplierName: item.supplierName ?? "",
        supplierCode: item.supplierCode ?? "",
        imageUrl: item.imageUrl ?? "",
        website: item.website ?? "",
        estimatedProfit:
            item.estimatedProfit == null ? undefined : Number(item.estimatedProfit),
    };
}

function toSale(row: SaleRow): Sale {
    return {
        id: row.id,
        timestamp: Number(row.timestamp_ms ?? 0),
        total: Number(row.total ?? 0),
        totalProfit: row.total_profit ?? undefined,
        items: Array.isArray(row.items) ? row.items.map(normalizeSaleItem) : [],
        operator: row.operator ?? "",
        paymentMethod: row.payment_method ?? undefined,
        updater: row.updater ?? undefined,
    };
}

function toSaleRow(input: UpsertSaleInput) {
    return {
        id: input.id,
        firebase_id: input.firebaseId ?? input.id,
        timestamp_ms: Number(input.timestamp ?? Date.now()),
        total: Number(input.total ?? 0),
        total_profit: input.totalProfit == null ? null : Number(input.totalProfit),
        items: input.items.map(normalizeSaleItem),
        operator: input.operator ?? "",
        payment_method: input.paymentMethod?.trim() ?? "",
        updater: input.updater?.trim() ?? null,
    };
}

const salesSelectColumns =
    "id, firebase_id, timestamp_ms, total, total_profit, items, operator, payment_method, updater, created_at, updated_at";

export async function fetchSalesInRange(startTime: number, endTime: number) {
    await ensureSupabaseFirebaseRoleClaim();

    const { data, error } = await supabase
        .from("sales")
        .select(salesSelectColumns)
        .gte("timestamp_ms", startTime)
        .lte("timestamp_ms", endTime)
        .order("timestamp_ms", { ascending: false });

    if (error) {
        throw error;
    }

    return (data satisfies SaleRow[]).map(toSale);
}

export async function insertSale(input: UpsertSaleInput) {
    await ensureSupabaseFirebaseRoleClaim();

    const { data, error } = await supabase
        .from("sales")
        .insert(toSaleRow(input))
        .select(salesSelectColumns)
        .single();

    if (error) {
        throw error;
    }

    return toSale(data satisfies SaleRow);
}

export async function updateSale(input: UpsertSaleInput) {
    await ensureSupabaseFirebaseRoleClaim();

    const { data, error } = await supabase
        .from("sales")
        .update(toSaleRow(input))
        .eq("id", input.id)
        .select(salesSelectColumns)
        .single();

    if (error) {
        throw error;
    }

    return toSale(data satisfies SaleRow);
}

export async function deleteSaleById(id: string) {
    await ensureSupabaseFirebaseRoleClaim();

    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) {
        throw error;
    }
}

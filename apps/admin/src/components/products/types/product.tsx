import type {Category} from "@/components/categories/types/category-types.tsx";

export interface Product {
    productId: string;
    name: string | null;
    sku: string | null;
    price: number;
    overridePoints: number | null;
    categories: Category[];
    createdAt: number;
    updatedAt: number;
}

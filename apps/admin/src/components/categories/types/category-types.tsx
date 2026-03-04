export interface Category {
    categoryId: string;
    name: string;
    kind: "PRODUCT" | "ACTIVITY";
    createdAt: number;
    updatedAt: number;
}

import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Label } from "@/components/ui/label.tsx";
import { ChevronLeft, ChevronRight, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import type { PaginationState } from "@tanstack/react-table";
import { type Dispatch, type SetStateAction, useState } from "react";

interface PaginationProps {
    pageIndex: number;
    pageSize: number;
}

interface TablePaginationProps {
    pagination: PaginationProps;
    onPaginationChange: Dispatch<SetStateAction<PaginationState>>;
    sizes: number[];
    hasNextPage?: boolean;
    onCalculateTotal?: () => void;
    total?: number;
}

export function TablePagination({ pagination, onPaginationChange, sizes, hasNextPage = false, onCalculateTotal, total }: TablePaginationProps) {
    const [isCalculating, setIsCalculating] = useState(false);

    const handleCalculate = async () => {
        if (onCalculateTotal) {
            setIsCalculating(true);
            try {
                await onCalculateTotal();
            } finally {
                setIsCalculating(false);
            }
        }
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 text-sm">
            <div className="text-muted-foreground flex items-center space-x-4">
                <span>Сторінка {pagination.pageIndex + 1}</span>
                {total !== undefined ? (
                    <span>Всього: {total}</span>
                ) : onCalculateTotal ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCalculate}
                        disabled={isCalculating}
                        className="h-8 shadow-sm flex items-center bg-background"
                    >
                        {isCalculating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calculator className="h-4 w-4 mr-2" />}
                        Порахувати всього
                    </Button>
                ) : null}
            </div>

            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <Label className="font-normal" htmlFor="page-size-trigger">Рядків на сторінці:</Label>
                    <Select
                        value={pagination.pageSize.toString()}
                        onValueChange={(value) => onPaginationChange(prev => ({ ...prev, pageSize: parseInt(value, 10), pageIndex: 0 }))}
                    >
                        <SelectTrigger id="page-size-trigger" className="h-8 w-[4.5rem]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {sizes.map((size) => (
                                <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Pagination className="w-auto">
                    <PaginationContent>
                        <PaginationItem>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={pagination.pageIndex === 0}
                                onClick={() => onPaginationChange(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </PaginationItem>
                        <PaginationItem>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={!hasNextPage}
                                onClick={() => onPaginationChange(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}

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

/** The mono footer strip that closes the table frame. */
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

    const pageCount = total !== undefined && pagination.pageSize > 0
        ? Math.max(1, Math.ceil(total / pagination.pageSize))
        : undefined;

    return (
        <div className="bg-surface-alt text-foreground/55 border-hairline flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-t px-4 py-2 text-[13px]">
            <div className="flex items-center gap-4">
                {total !== undefined ? (
                    <span>Всього: <span className="text-accent-bright font-mono font-medium">{total}</span></span>
                ) : onCalculateTotal ? (
                    <Button
                        variant="ghostOutline"
                        size="sm"
                        onClick={handleCalculate}
                        disabled={isCalculating}
                        className="h-7 cursor-pointer px-0 text-[12px] tracking-[.06em]"
                    >
                        {isCalculating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Calculator className="mr-2 h-3.5 w-3.5" />}
                        Порахувати всього
                    </Button>
                ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2">
                    <Label variant="inline" className="text-[13px] font-normal text-foreground/55" htmlFor="page-size-trigger">
                        Рядків на сторінці:
                    </Label>
                    <Select
                        value={pagination.pageSize.toString()}
                        onValueChange={(value) => onPaginationChange(prev => ({ ...prev, pageSize: parseInt(value, 10), pageIndex: 0 }))}
                    >
                        <SelectTrigger id="page-size-trigger" size="sm" className="h-7 w-[4.25rem] cursor-pointer border-[rgba(237,230,216,.15)] bg-transparent px-2.5 font-mono text-[12px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {sizes.map((size) => (
                                <SelectItem key={size} value={size.toString()} className="cursor-pointer font-mono">{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <span>
                    Сторінка <span className="text-foreground/80 font-mono font-medium">{pagination.pageIndex + 1}</span>
                    {pageCount !== undefined ? <> з <span className="font-mono">{pageCount}</span></> : null}
                </span>

                <div className="flex items-center gap-1.5">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        className="h-7 w-[30px] cursor-pointer border-[rgba(237,230,216,.15)]"
                        disabled={pagination.pageIndex === 0}
                        onClick={() => onPaginationChange(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        className="text-primary h-7 w-[30px] cursor-pointer border-[rgba(201,158,58,.5)]"
                        disabled={!hasNextPage}
                        onClick={() => onPaginationChange(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 }))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

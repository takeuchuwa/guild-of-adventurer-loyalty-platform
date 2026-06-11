"use client"

import { useState, useEffect } from "react"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MemberSelectionDialog } from "@/components/shared/dialogs/member-selection-dialog"
import type { Member } from "@/components/members/types/member"
import { fetchLevels } from "@/components/levels/api/level-api"
import { UserPlus, X, Globe, Users, Target, UserIcon } from "lucide-react"

export interface PromotionAssignmentMember {
    firstName: string | null
    lastName: string | null
    phone: string | null
}

export interface PromotionAssignment {
    assignmentId: string
    memberId: string
    promoId: string
    status: "AVAILABLE" | "USED" | "EXPIRED" | string
    uniqueCode: string | null
    assignedAt: number
    redeemedAt: number | null
    member?: PromotionAssignmentMember | null
}

interface AssignmentsPanelProps {
    existingAssignments?: PromotionAssignment[]
}

export function AssignmentsPanel({ existingAssignments = [] }: AssignmentsPanelProps) {
    const { watch, setValue } = useFormContext()
    const mode = watch("mode")
    const memberIds: string[] = watch("assignments.memberIds") || []
    const levelAssignments: string[] = watch("levelAssignments") || []
    const generateUniqueCodes: boolean = watch("assignments.generateUniqueCodes") || false

    // Scope toggles — derive initial state from existing data
    const [levelScope, setLevelScope] = useState<"all" | "specific">(
        levelAssignments.length > 0 ? "specific" : "all"
    )
    const [memberScope, setMemberScope] = useState<"all" | "specific">(
        memberIds.length > 0 ? "specific" : "all"
    )

    const [levels, setLevels] = useState<{ levelId: string, name: string }[]>([])
    const [isLoadingLevels, setIsLoadingLevels] = useState(false)

    useEffect(() => {
        async function loadLevels() {
            setIsLoadingLevels(true)
            try {
                // Fetch up to 100 levels for assignment selection
                const data = await fetchLevels({
                    pagination: { pageIndex: 0, pageSize: 100 }
                })
                setLevels(data.levels || [])
            } catch (err) {
                console.error("Failed to fetch levels", err)
            } finally {
                setIsLoadingLevels(false)
            }
        }
        loadLevels()
    }, [])

    const toggleLevel = (levelId: string) => {
        const set = new Set(levelAssignments)
        if (set.has(levelId)) {
            set.delete(levelId)
        } else {
            set.add(levelId)
        }
        setValue("levelAssignments", Array.from(set), { shouldDirty: true })
    }

    const handleLevelScopeChange = (scope: string) => {
        setLevelScope(scope as "all" | "specific")
        if (scope === "all") {
            // Clear level selections when switching to "all"
            setValue("levelAssignments", [], { shouldDirty: true })
        }
    }

    const handleMemberScopeChange = (scope: string) => {
        setMemberScope(scope as "all" | "specific")
        if (scope === "all") {
            // Clear member selections when switching to "all"
            setValue("assignments.memberIds", [], { shouldDirty: true })
            setMemberDisplayMap(new Map())
        }
    }

    // Local map for display names — populated when user picks members from the dialog
    const [memberDisplayMap, setMemberDisplayMap] = useState<Map<string, Member>>(new Map())
    const [dialogOpen, setDialogOpen] = useState(false)

    const handleMembersConfirm = (newMembers: Map<string, Member>) => {
        setMemberDisplayMap((prev) => {
            const merged = new Map(prev)
            newMembers.forEach((member, id) => merged.set(id, member))
            return merged
        })

        const existingIds = new Set(memberIds)
        newMembers.forEach((_, id) => existingIds.add(id))
        setValue("assignments.memberIds", Array.from(existingIds), { shouldDirty: true })
    }

    const handleRemoveMember = (memberId: string) => {
        setMemberDisplayMap((prev) => {
            const next = new Map(prev)
            next.delete(memberId)
            return next
        })
        const updated = memberIds.filter((id: string) => id !== memberId)
        setValue("assignments.memberIds", updated, { shouldDirty: true })
        // If last member removed, auto-switch back to "all"
        if (updated.length === 0) {
            setMemberScope("all")
        }
    }

    const handleGenerateUniqueCodesChange = (checked: boolean) => {
        setValue("assignments.generateUniqueCodes", checked, { shouldDirty: true })
    }

    // Quick lookup: memberId → assignment (for status / member info from API)
    const assignmentByMemberId = new Map(existingAssignments.map((a) => [a.memberId, a]))

    const formatDate = (ts: number) =>
        new Date(ts * 1000).toLocaleDateString("uk-UA", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })

    // Merged display list: for each form memberId, prefer the API assignment's embedded member data,
    // falling back to what the dialog populated in the local display map.
    const displayList = memberIds.map((id) => {
        const fromApi = assignmentByMemberId.get(id)
        const fromDialog = memberDisplayMap.get(id)
        return {
            memberId: id,
            assignment: fromApi,
            firstName: fromApi?.member?.firstName ?? fromDialog?.firstName ?? null,
            lastName: fromApi?.member?.lastName ?? fromDialog?.lastName ?? null,
            phone: fromApi?.member?.phone ?? fromDialog?.phone ?? null,
        }
    })

    return (
        <div className="border rounded-lg bg-white shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-4">Цільова аудиторія</h3>

            <Tabs defaultValue="levels" className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-6">
                    <TabsTrigger value="levels" className="flex items-center gap-2 cursor-pointer">
                        <Target className="h-4 w-4" />
                        Рівні
                    </TabsTrigger>
                    <TabsTrigger value="members" className="flex items-center gap-2 cursor-pointer">
                        <UserIcon className="h-4 w-4" />
                        Учасники
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="levels" className="space-y-4">
                    <RadioGroup
                        value={levelScope}
                        onValueChange={handleLevelScopeChange}
                        className="flex gap-4 mb-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="level-scope-all" className="cursor-pointer" />
                            <Label htmlFor="level-scope-all" className="cursor-pointer font-normal flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                Для всіх рівнів
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="specific" id="level-scope-specific" className="cursor-pointer" />
                            <Label htmlFor="level-scope-specific" className="cursor-pointer font-normal flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                Для обраних рівнів
                            </Label>
                        </div>
                    </RadioGroup>

                    {levelScope === "all" ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                            <Globe className="h-4 w-4 shrink-0" />
                            <span>Ця промоакція застосовується до <strong>всіх рівнів</strong></span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {isLoadingLevels ? (
                                <div className="text-sm text-muted-foreground">Завантаження рівнів...</div>
                            ) : levels.length === 0 ? (
                                <div className="text-sm text-muted-foreground">Рівні не знайдені</div>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Виберіть рівні, яким буде призначена ця промоакція.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {levels.map((level) => (
                                            <div
                                                key={level.levelId}
                                                className="flex items-center space-x-2 border rounded p-3 hover:bg-gray-50 transition-colors"
                                            >
                                                <Checkbox
                                                    id={`level-${level.levelId}`}
                                                    checked={levelAssignments.includes(level.levelId)}
                                                    onCheckedChange={() => toggleLevel(level.levelId)}
                                                    className="cursor-pointer"
                                                />
                                                <Label
                                                    htmlFor={`level-${level.levelId}`}
                                                    className="cursor-pointer text-sm font-medium w-full"
                                                >
                                                    {level.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    {levelAssignments.length === 0 && (
                                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-center gap-1.5">
                                            <span>⚠️</span>
                                            <span>Оберіть хоча б один рівень, або переключіть на «Для всіх рівнів». Якщо ви хочете вимкнути промоакцію, зніміть прапорець «Активна» в блоці основної інформації вище.</span>
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                    <RadioGroup
                        value={memberScope}
                        onValueChange={handleMemberScopeChange}
                        className="flex gap-4 mb-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="member-scope-all" className="cursor-pointer" />
                            <Label htmlFor="member-scope-all" className="cursor-pointer font-normal flex items-center gap-1.5">
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                Для всіх учасників
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="specific" id="member-scope-specific" className="cursor-pointer" />
                            <Label htmlFor="member-scope-specific" className="cursor-pointer font-normal flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                Для обраних учасників
                            </Label>
                        </div>
                    </RadioGroup>

                    {memberScope === "all" ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                            <Globe className="h-4 w-4 shrink-0" />
                            <span>Ця промоакція доступна <strong>всім учасникам</strong></span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Generate unique codes checkbox — only for COUPON mode */}
                            {mode === "COUPON" && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="generateUniqueCodes"
                                        checked={generateUniqueCodes}
                                        onCheckedChange={(checked) => handleGenerateUniqueCodesChange(checked === true)}
                                        className="cursor-pointer"
                                    />
                                    <Label htmlFor="generateUniqueCodes" className="cursor-pointer text-sm font-normal">
                                        Генерувати унікальні коди для кожного учасника
                                    </Label>
                                </div>
                            )}

                            {/* Add members button */}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(true)}
                                className="w-full cursor-pointer"
                            >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Додати учасників
                            </Button>

                            {/* Warning when "specific" but no members selected */}
                            {displayList.length === 0 && (
                                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 flex items-center gap-1.5">
                                    <span>⚠️</span>
                                    <span>Додайте хоча б одного учасника, або переключіть на «Для всіх учасників». Якщо ви хочете вимкнути промоакцію, зніміть прапорець «Активна» в блоці основної інформації вище.</span>
                                </p>
                            )}

                            {/* Assigned members list */}
                            {displayList.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        Обрано учасників: {displayList.length}
                                    </p>
                                    <div className="space-y-2">
                                        {displayList.map(({ memberId, assignment, firstName, lastName, phone }) => {
                                            const isUsed = assignment?.status === "USED"
                                            const isExpired = assignment?.status === "EXPIRED"

                                            return (
                                                <div
                                                    key={memberId}
                                                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border bg-white"
                                                >
                                                    {/* Name + phone */}
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-medium truncate">
                                                            {firstName} {lastName}
                                                        </span>
                                                        {phone && (
                                                            <span className="text-xs text-muted-foreground">{phone}</span>
                                                        )}
                                                    </div>

                                                    {/* Status badge + redemption date */}
                                                    {assignment && (
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span
                                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${isUsed
                                                                    ? "bg-green-100 text-green-700"
                                                                    : isExpired
                                                                        ? "bg-red-100 text-red-700"
                                                                        : "bg-yellow-100 text-yellow-700"
                                                                    }`}
                                                            >
                                                                {isUsed ? "Використано" : isExpired ? "Прострочено" : "Доступно"}
                                                            </span>
                                                            {isUsed && assignment.redeemedAt && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatDate(assignment.redeemedAt)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Remove button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveMember(memberId)}
                                                        className="hover:bg-muted rounded-full p-1 transition-colors cursor-pointer shrink-0"
                                                        title="Видалити з призначених"
                                                    >
                                                        <X className="h-3 w-3 text-muted-foreground" />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Member selection dialog */}
                    <MemberSelectionDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        onConfirm={handleMembersConfirm}
                        excludeMemberIds={memberIds}
                        initialMemberIds={memberIds}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

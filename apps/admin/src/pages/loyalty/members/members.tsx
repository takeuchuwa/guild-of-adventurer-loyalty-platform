"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { MemberTable } from "@/components/members/members-table.tsx"
import { UnclaimedPrizesTable } from "@/components/members/unclaimed-prizes-table.tsx"
import { Coins, Pencil, Trash2, Users, Gift } from "lucide-react"
import type { Member } from "@/components/members/types/member.tsx"
import { memberColumns } from "@/components/members/columns/member-columns.tsx"
import { useNavigate } from "react-router-dom"
import { useRef, useState } from "react"
import { PointsAdjustmentWarningDialog } from "@/components/shared/dialogs/points-adjustment-warning-dialog"
import { PointsAdjustmentDialog } from "@/components/shared/dialogs/points-adjustment-dialog"

export default function MembersPage() {
  const [activeTab, setActiveTab] = useState<"all" | "unclaimed">("all")
  const searchPlaceholder = "Пошук за номером телефону..."

  const navigate = useNavigate()

  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false)
  const loadMembersRef = useRef<(() => Promise<void>) | null>(null)

  const handleEditMember = (selected: Member[]) => {
    const member = selected[0]
    if (member) {
      console.log("Edit member:", member)
      navigate(`/members/${member.memberId}`)
    }
  }

  const handleChangePoints = (selected: Member[]) => {
    const member = selected[0]
    if (member) {
      console.log("Change points for member:", member)
      setSelectedMember(member)
      setWarningDialogOpen(true)
    }
  }

  const handleDeleteMember = (selected: Member[]) => {
    const member = selected[0]
    if (member) {
      console.log("Delete member:", member)
      // TODO: trigger delete confirmation or API call
    }
  }

  const handleSuccess = async () => {
    if (loadMembersRef.current) {
      await loadMembersRef.current()
    }
  }

  const handleWarningConfirm = () => {
    setPointsDialogOpen(true)
  }

  return (
    <Layout breadcrumbs={[{ label: "Авантюристи", path: "/members" }]}>
      <div className="container mx-auto py-10 flex flex-col gap-6">
        <div className="flex bg-muted p-1 rounded-md w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm transition-colors ${activeTab === "all"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              }`}
          >
            <Users className="h-4 w-4" />
            Всі авантюристи
          </button>
          <button
            onClick={() => setActiveTab("unclaimed")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-sm transition-colors ${activeTab === "unclaimed"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              }`}
          >
            <Gift className="h-4 w-4" />
            Неотримані призи
          </button>
        </div>

        {activeTab === "all" ? (
          <MemberTable
            columns={memberColumns}
            searchPlaceholder={searchPlaceholder}
            title="Авантюристи"
            onLoadMembersRef={loadMembersRef}
            actions={[
              {
                label: "Редагувати профіль",
                icon: <Pencil className="mr-0.5 h-4 w-4" />,
                onClick: handleEditMember,
                isDisabled: (selected: Member[]) => selected.length !== 1,
              },
              {
                label: "Змінити бали",
                icon: <Coins className="mr-0.5 h-4 w-4" />,
                onClick: handleChangePoints,
                isDisabled: (selected: Member[]) => selected.length !== 1,
              },
              {
                label: "Видалити",
                icon: <Trash2 className="mr-0.5 h-4 w-4" />,
                onClick: handleDeleteMember,
                isDisabled: (selected: Member[]) => selected.length !== 1,
                variant: "destructiveOutline",
              },
            ]}
          />
        ) : (
          <UnclaimedPrizesTable />
        )}
      </div>

      <PointsAdjustmentWarningDialog
        open={warningDialogOpen}
        onOpenChange={setWarningDialogOpen}
        onConfirm={handleWarningConfirm}
      />

      <PointsAdjustmentDialog
        open={pointsDialogOpen}
        onOpenChange={setPointsDialogOpen}
        member={selectedMember}
        onSuccess={handleSuccess}
      />
    </Layout>
  )
}

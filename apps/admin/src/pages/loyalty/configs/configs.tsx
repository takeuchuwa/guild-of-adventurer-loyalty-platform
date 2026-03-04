"use client"

import { Layout } from "@/components/layout/layout.tsx"
import { ConfigsTable } from "@/components/configs/configs-table"
import { configColumns } from "@/components/configs/columns/config-columns"
import { Pencil, PlusCircle, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useRef, useState } from "react"
import type { LoyaltyConfig } from "@/components/configs/api/configs-api"
import { DeleteConfirmationDialog } from "@/components/shared/dialogs/delete-confirmation-dialog"
import { deleteConfig } from "@/components/configs/api/configs-api"
import { toast } from "sonner"

export default function ConfigsPage() {
  const navigate = useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [configToDelete, setConfigToDelete] = useState<LoyaltyConfig | null>(null)
  const loadRef = useRef<(() => Promise<void>) | null>(null)

  const handleCreate = () => navigate("/configs/create")
  const handleEdit = (selected: LoyaltyConfig[]) => {
    const c = selected[0]
    if (c) navigate(`/configs/${c.configId}`)
  }
  const handleDelete = (selected: LoyaltyConfig[]) => {
    const c = selected[0]
    if (c) { setConfigToDelete(c); setDeleteDialogOpen(true) }
  }

  const confirmDelete = async () => {
    if (!configToDelete) return
    try {
      await deleteConfig(configToDelete.configId)
      toast.success("Конфігурацію видалено")
      if (loadRef.current) await loadRef.current()
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || "Помилка видалення")
    } finally {
      setConfigToDelete(null)
    }
  }

  return (
    <Layout breadcrumbs={[{ label: "Конфігурації", path: "/configs" }]}>
      <div className="container mx-auto py-10">
        <ConfigsTable
          columns={configColumns}
          title="Конфігурації лояльності"
          selectionMode="single"
          onLoadRef={loadRef}
          actions={[
            { label: "Додати", icon: <PlusCircle className="mr-0.5 h-4 w-4" />, onClick: handleCreate },
            { label: "Редагувати", icon: <Pencil className="mr-0.5 h-4 w-4" />, onClick: handleEdit, isDisabled: (s) => s.length !== 1 },
            { label: "Видалити", icon: <Trash2 className="mr-0.5 h-4 w-4" />, onClick: handleDelete, isDisabled: (s) => s.length !== 1, variant: "destructiveOutline" },
          ]}
        />
      </div>
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Видалити конфігурацію"
        description="Ця дія незворотна. Конфігурацію буде видалено назавжди."
        itemName={configToDelete?.name}
      />
    </Layout>
  )
}

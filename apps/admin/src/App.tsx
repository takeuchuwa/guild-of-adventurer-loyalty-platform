import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import SettingsPage from "@/pages/settings.tsx"
import { Toaster } from "@/components/ui/sonner.tsx"
import GamesPage from "@/pages/groups/games/games.tsx"
import MembersPage from "@/pages/loyalty/members/members.tsx"
import MemberEditPage from "@/pages/loyalty/members/member-edit.tsx"
import ProductsPage from "@/pages/club/products/products.tsx"
import ActivitiesPage from "@/pages/club/activities/activities.tsx"
import CheckoutPage from "@/pages/checkout.tsx"
import LevelsPage from "@/pages/loyalty/levels/levels.tsx"
import CategoriesPage from "@/pages/groups/categories/categories.tsx"
import MembersAddPage from "@/pages/loyalty/members/members-add.tsx"
import CategoryCreatePage from "@/pages/groups/categories/category-create.tsx"
import CategoryEditPage from "@/pages/groups/categories/category-edit.tsx"
import GamesCreatePage from "@/pages/groups/games/games-create.tsx"
import GamesEditPage from "@/pages/groups/games/games-edit.tsx"
import ProductCreatePage from "@/pages/club/products/product-create.tsx"
import ProductEditPage from "@/pages/club/products/product-edit.tsx"
import ActivityCreatePage from "@/pages/club/activities/activity-create.tsx"
import ActivityEditPage from "@/pages/club/activities/activity-edit.tsx"
import RoomsPage from "@/pages/groups/rooms/rooms.tsx";
import RoomCreatePage from "@/pages/groups/rooms/room-create.tsx";
import RoomEditPage from "@/pages/groups/rooms/room-edit.tsx";
import LevelCreatePage from "@/pages/loyalty/levels/level-create.tsx";
import LevelEditPage from "@/pages/loyalty/levels/level-edit.tsx";
import ConfigsPage from "@/pages/loyalty/configs/configs.tsx";
import ConfigCreatePage from "@/pages/loyalty/configs/config-create.tsx";
import ConfigEditPage from "@/pages/loyalty/configs/config-edit.tsx";
import PromotionsPage from "@/pages/club/promotions/promotions.tsx";
import PromotionCreatePage from "@/pages/club/promotions/promotion-create.tsx";
import PromotionEditPage from "@/pages/club/promotions/promotion-edit.tsx";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/members" replace />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/categories/create" element={<CategoryCreatePage />} />
                <Route path="/categories/:id" element={<CategoryEditPage />} />
                <Route path="/rooms" element={<RoomsPage />} />
                <Route path="/rooms/create" element={<RoomCreatePage />} />
                <Route path="/rooms/:id" element={<RoomEditPage />} />
                <Route path="/members" element={<MembersPage />} />
                <Route path="/members/create" element={<MembersAddPage />} />
                <Route path="/members/:id" element={<MemberEditPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/create" element={<ProductCreatePage />} />
                <Route path="/products/:id" element={<ProductEditPage />} />
                <Route path="/activities" element={<ActivitiesPage />} />
                <Route path="/activities/create" element={<ActivityCreatePage />} />
                <Route path="/activities/:id" element={<ActivityEditPage />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/games/create" element={<GamesCreatePage />} />
                <Route path="/games/:id" element={<GamesEditPage />} />
                <Route path="/levels" element={<LevelsPage />} />
                <Route path="/levels/create" element={<LevelCreatePage />} />
                <Route path="/levels/:id" element={<LevelEditPage />} />
                <Route path="/configs" element={<ConfigsPage />} />
                <Route path="/configs/create" element={<ConfigCreatePage />} />
                <Route path="/configs/:id" element={<ConfigEditPage />} />
                <Route path="/promotions" element={<PromotionsPage />} />
                <Route path="/promotions/create" element={<PromotionCreatePage />} />
                <Route path="/promotions/:id" element={<PromotionEditPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
            </Routes>
            <Toaster />
        </BrowserRouter>
    )
}

export default App

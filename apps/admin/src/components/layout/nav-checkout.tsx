import {useNavigate} from "react-router-dom"
import {ShoppingCartIcon} from "lucide-react"
import {Button} from "@/components/ui/button"

export function NavCheckout() {
    const navigate = useNavigate()

    return (
        <Button onClick={() => navigate("/checkout")} variant="default" className="cursor-pointer">
            <ShoppingCartIcon className="mr-2 h-4 w-4"/>
            Каса
        </Button>
    )
}

// Keyboards
import { Keyboard } from "grammy";
import { texts } from "./texts";

export const keyboards = {
    // Shown to unregistered users
    share_contact: new Keyboard()
        .requestContact(texts.ask_contact_button)
        .oneTime()
        .resized(),

    // Shown to registered members
    main_menu: new Keyboard()
        .webApp("Open Guild App", "https://aa35-109-87-26-199.ngrok-free.app")
        .row()
        .text(texts.my_level_button)
        .text(texts.points_history_button)
        .row()
        .text(texts.loyalty_details_button)
        .text(texts.ref_button)
        .row()
        .text(texts.help_button)
        .resized(),
}

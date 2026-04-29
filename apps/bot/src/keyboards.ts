// Keyboards
import { Keyboard, InlineKeyboard } from "grammy";
import { texts } from "./texts";
import { Env } from "./types";

export const keyboards = {
    // Shown to unregistered users
    share_contact: new Keyboard()
        .requestContact(texts.ask_contact_button)
        .oneTime()
        .resized(),

    // Web App button for registered users
    main_menu: (env: Env) => new InlineKeyboard()
        .webApp(texts.open_mini_app_button, env.MINI_APP_URL || "https://example.com"),
}

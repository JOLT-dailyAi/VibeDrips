# READ_UI_Design_Specs: The Regional Flight

## 1. Interaction Model: The "Flight" 🚀
- **Entry (Normal Modal)**: Button displays 🚀 (Rocket). Intent: "Launch discovery flight across regions."
- **Hub View (Discovery Feed)**: The Reels Modal displays the "Marketplace Dropdown" for filtering.
- **Variant View (Landing)**: If the user "lands" on a product, the button shifts to 🌐 (Globe with meridians). Intent: "Return to the Global Hub."
- **Persistence**: Filter state is synced with `localStorage`.
- *Redundant*: Nesting counts/hops (replaced by Circular Mode).

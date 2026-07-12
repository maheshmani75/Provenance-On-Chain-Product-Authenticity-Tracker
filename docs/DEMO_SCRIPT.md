# Demo video script (1–2 minutes)

Use two browser profiles (or two devices) to represent the manufacturer and
a consumer.

1. **(0:00–0:15) Hook** — "This tracks a product's real chain of custody
   on-chain. Scan it, and you see exactly who's held it and where — a
   counterfeit can't fake that history."

2. **(0:15–0:35) Register a product** — As the manufacturer, register a
   product with a name and serial number. Show the transaction confirm and
   the QR code generate.

3. **(0:35–0:55) Transfer custody** — Transfer the product to a "distributor"
   address with a location note. Show `CustodyTransferred` land in the live
   activity feed instantly. Do a second transfer to a "retailer" to show the
   chain growing.

4. **(0:55–1:15) Scan to verify** — Switch to the Verify view (ideally on a
   phone), scan the product's QR code, show the green "Verified authentic"
   seal and the full multi-hop timeline underneath. Then demonstrate
   flagging: click "Report as counterfeit" and show the seal flip to red.

5. **(1:15–1:30) Wrap-up** — Resize the browser to phone width to show
   mobile responsiveness, show `cargo test --workspace` passing, and show
   the GitHub Actions CI run green.

Keep narration plain and specific — name what's on screen, not what it's
"powered by."

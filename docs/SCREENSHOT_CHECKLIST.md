# Screenshots to capture for submission

Save these into `docs/screenshots/` and reference them in your README or
submission form.

1. **Mobile responsive UI** — open the deployed Vercel/Netlify URL in Chrome
   DevTools device mode (iPhone 14 or similar, 390px width) and screenshot
   the Verify view with the verification seal visible.

2. **CI/CD pipeline running** — push a commit, open the **Actions** tab on
   GitHub, screenshot a green run showing both the `contracts` and `frontend`
   jobs passing.

3. **Test output, 3+ passing tests** — run `cargo test --workspace` in your
   terminal and screenshot the summary line (should show 12 passed). Also
   run `npm run test` in `frontend/` and screenshot Vitest's summary
   (6 passed).

4. **A real transaction** — after running `scripts/sample_interaction.sh`,
   open one of the tx hashes on
   [Stellar Expert testnet explorer](https://stellar.expert/explorer/testnet)
   and screenshot the confirmed transaction page.

5. **A multi-hop custody timeline** — screenshot the Verify view for a
   product that's been transferred more than once, showing the full
   chain-of-custody list — this is your clearest demonstration of the
   cross-contract call working end to end.

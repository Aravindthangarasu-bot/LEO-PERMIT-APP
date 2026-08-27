# Document Wallet Acceptance Criteria

Tested on 2026-08-22 using the clean Vite server at `http://127.0.0.1:5174`.

| ID | Acceptance criterion | Result | Evidence / notes |
| --- | --- | --- | --- |
| DW-01 | A customer can open Document Wallet from the portal navigation. | PASS | `/customer/wallet` renders the wallet heading and navigation entry. |
| DW-02 | Customer documents are automatically visible after they are attached to an application. | PASS | Stored file `updated the tax receipt.jpg` appeared in the customer wallet. |
| DW-03 | Wallet documents are grouped by permit service type. | PASS | The stored file rendered beneath the `New Building Permit` group. |
| DW-04 | Wallet shows document uploader classification. | PASS | The stored customer document displayed `Customer upload`. |
| DW-05 | Wallet provides a secure file-open action when a URL exists. | PASS | The document card exposed an `Open` link to its Supabase Storage URL. |
| DW-06 | A provider can open a Document Wallet from provider navigation. | PASS | `/provider/wallet` renders the wallet heading and navigation entry. |
| DW-07 | An office staff member can open a wallet containing only documents for assigned applications. | PASS | Rajan Menon's `/staff/wallet` displayed only the one document tied to his assigned application. |
| DW-08 | Provider and staff plan uploads retain the actual uploader role. | PASS - code path | `ActionConsole` records `uploadedBy: 'provider'` or `uploadedBy: 'staff'`; no persisted provider/staff plan fixture was available for browser verification. |
| DW-09 | Customer can reuse a saved wallet document in a new application. | BLOCKED | The saved-copy buttons render from wallet documents, but the integrated browser test harness reported the service selection tile as continuously unstable and could not advance the animated form. |
| DW-10 | Documents are not duplicated in the wallet. | PASS - design | The wallet is a derived view over application document records and does not create a second file copy. |

## Known Test Constraints

- The Supabase fixture contains one persisted customer document and no provider/staff plan-upload fixture, so a live classification card for provider/staff uploads could not be observed.
- The browser automation environment could not click the service tile in the new-application form because it never became stable. This blocks only the end-to-end saved-copy selection check, not the wallet route or document listing checks.
- The deployment database still needs the existing `serviced_by` migration before provider ownership tests can pass; this is separate from the document wallet.

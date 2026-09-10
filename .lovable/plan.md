# Modern Quotation and Invoice Creation Forms

## Overview
Redesign both create/edit dialogs with a polished purple-accented layout while preserving every existing field and workflow. Client details will auto-fill from the selected client but remain editable for that specific document, and the letterhead choice will be saved per quotation or invoice.

## Form updates
- Add a modern header with a purple document badge, create/edit title, and short subtitle.
- Keep all existing fields, including invoice LPO/PO Number and LPO Value.
- Show the auto-sequenced quotation or invoice number as a read-only field.
- Include Client Name, Contact Person, TRN No, Project Name, Site Location, Date, and Valid Until or Due Date.
- Auto-fill contact, TRN, and location from the selected client, while allowing document-specific edits.
- Build a labeled line-items table with Description, Qty, Unit Price, Total, and delete action only; retain product selection and automatic pricing.
- Add Notes / Remarks and a saved pre-printed-letterhead checkbox on the left.
- Add a live Subtotal, VAT, and purple-highlighted Grand Total summary on the right.
- Add clear Cancel and Save actions in the footer.
- Keep create, edit, validation, quotation conversion, payment, and numbering behavior intact.

## Document and print updates
- Store document-specific contact person, TRN, site location, notes, due/valid date, and letterhead preference.
- Print the stored client/project details accurately instead of relying only on later client-record changes.
- Add invoice Due Date and include Notes / Remarks in invoice and quotation previews when provided.
- Initialize the existing print-preview letterhead control from the document’s saved preference while keeping it adjustable before printing.

## Visual system
- Add semantic purple dialog tokens to the existing theme so the new style works consistently in light and dark modes.
- Use soft corners, a clean surface, a blurred overlay, compact field grouping, and responsive stacking for smaller screens.
- Keep the teal/dark-cyan PDF document theme unchanged except for the requested field accuracy and notes.

## Verification
- Check both create and edit dialogs at desktop and narrow widths.
- Create one quotation and one invoice to verify numbering, auto-fill, editable overrides, totals, saved notes, and saved letterhead choice.
- Preview both documents and verify all client/project fields and dates appear correctly with no Unit column.

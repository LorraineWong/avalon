# Voluntary support page

The seven-language [about and support page](../support/) is public. It explains
the game's origin, free play, intended use of support, AI creation credits and
unofficial status. Contact links are the approved GitHub and LinkedIn profiles;
no personal email is published. A payment provider/account URL has not been
selected, so the page clearly says financial support is not open yet.

## Implementation

`assets/js/project.js` contains the story/translations and approved contact
URLs. Its `config.support` is empty until the owner provides a verified HTTPS
payment-page URL. The page is linked from the shared menu/footer and game
fallback footer. The static English fallback must be kept aligned with the
rendered page, including payment state and contact links.

Payment data stays on the provider. Do not add an embedded widget, donor
identity storage, public donor list or gameplay benefits. Gameplay remains free.

## Initial recommendation, checked 14 November 2026

Start with voluntary one-time support on Ko-fi Free, subject to payment-account eligibility. The owner confirmed Malaysian personal/
bank-account collection; individual provider approval is still required. Ko-fi's official fees page
shows 0% platform fee for one-off tips on Free and 5% on Standard; processor and
currency-conversion fees are separate. Inspect the actual account's mode and
turn off optional Standard / “Get all of Ko-fi” if Free is intended. Do not buy a
subscription to accept the first contributions.

GitHub Sponsors is an alternative for eligible open-source contributors in
supported regions. It currently charges no fee for sponsorship from personal
accounts and up to 6% for organization sponsorship. Malaysia and Singapore are
on the published supported-region list; this is not confirmation of the owner's
residence or individual approval. The source/docs MIT scope is separate from
the image exclusion and original game rights.

A creator's real country, bank, identity verification and tax details belong
with the provider, not in this repository. Do not choose a fictitious country
to unlock features or accept provider agreements for the owner.

## Privacy and activation checklist

1. The owner completes provider signup/identity and any required payment
   account setup, reviews the terms, then supplies the exact public URL.
2. Check what a supporter sees on checkout and receipts. Ko-fi says personal
   PayPal commonly exposes the creator's legal name and email. Stripe's visible
   statement descriptor and public business/support fields also need review;
   do not promise anonymity. Use an appropriate separate support address if
   required by the provider, while keeping the personal email off this site.
3. Verify one-time is the intended flow. Show amount/currency and avoid a
   preselected recurring commitment. Confirm fees, conversion, payouts, refunds
   and contact method in the provider interface. Do not claim tax-deductibility.
4. Update `config.support`, the static page fallback, privacy disclosures and
   terms in all seven languages to match the actual service. Any retained
   donation/refund wording must be reconciled before receiving payments.
5. Verify mobile/desktop, both themes, external link destination and receipt
   details. Any real test payment must be made by the owner; never charge a
   card just to test the button.
6. Add `.github/FUNDING.yml` only when the selected account is ready. No guessed
   Ko-fi username or unapproved GitHub Sponsors URL should be published.

Sources:

- [Ko-fi fees](https://help.ko-fi.com/hc/en-us/articles/360002506494-Does-Ko-fi-take-a-fee)
- [Ko-fi creator privacy and payment-provider disclosure](https://help.ko-fi.com/hc/en-us/articles/115004001294-What-personal-information-is-shared-on-Ko-fi-as-a-creator)
- [GitHub Sponsors fees and supported regions](https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors)

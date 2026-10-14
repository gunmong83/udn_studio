# Repository agent notes

- Before changing checkout, delivery, or Kakao AlimTalk behavior, read [docs/alimtalk-shipping.md](docs/alimtalk-shipping.md). It records the Naver Cloud template already registered for shipment-start notices and the requirements for any future integration.
- Treat Naver Cloud Console configuration as external state. Verify the current template and review status before creating another template or assuming it is approved.
- Never commit Naver Cloud credentials, Kakao credentials, recipient phone numbers, or production `.env` values. Keep service keys in local/server environment configuration only.

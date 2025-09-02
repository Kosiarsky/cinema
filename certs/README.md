Local development certificates

Place your development TLS key and cert in the top-level certs/ folder (next to backend/ and frontend/), and update paths in frontend/.env if different.

Recommended (Windows): mkcert
- Install Chocolatey: https://chocolatey.org/install
- choco install mkcert
- mkcert -install
- mkcert localhost

This will generate files like:
- localhost-key.pem (or localhost.key)
- localhost.pem (or localhost.crt)

Then set in frontend/.env:
FRONTEND_USE_HTTPS=true
FRONTEND_SSL_KEY_PATH=../certs/localhost-key.pem
FRONTEND_SSL_CERT_PATH=../certs/localhost.pem

Alternatively, using OpenSSL (run from repo root or adjust paths):
# From repo root
openssl req -x509 -newkey rsa:2048 -nodes -keyout certs/localhost.key -out certs/localhost.crt -days 365 -subj "/CN=localhost"
# Or if you are inside certs/ folder
openssl req -x509 -newkey rsa:2048 -nodes -keyout localhost.key -out localhost.crt -days 365 -subj "/CN=localhost"

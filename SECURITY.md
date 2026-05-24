# Security Policy

## Supported Versions

| Version | Supported          |
|---------|-------------------|
| 1.0.x   | :white_check_mark: Yes |
| < 1.0   | :x: No            |

## Reporting a Vulnerability

**Do NOT open a public issue** for security vulnerabilities!

### Private Disclosure Process

1. **Email:** Send security reports to: `security@termiaxial.dev`
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Impact assessment
   - Proof of concept (if applicable)

### What to Expect

- We will acknowledge receipt within 48 hours
- We will provide a detailed response within 7 days
- We will work with you on a fix timeline
- We will coordinate disclosure with you

### Disclosure Timeline

1. **Initial Report:** Within 48 hours
2. **Initial Assessment:** Within 7 days
3. **Fix Development:** As agreed upon
4. **Public Disclosure:** After fix is deployed

### Security Best Practices

When reporting:
- Use PGP encryption if possible
- Don't share proof-of-concept publicly
- Wait for coordination before disclosure
- Provide reasonable time to fix

## Security Features

Termiaxial includes the following security features:

- **Encrypted Credential Vault**: AES-GCM-256 encryption
- **Master Password Protection**: Argon2id hashing
- **Local-First Storage**: No cloud sync by default
- **Secure Key Storage**: System keychain integration
- **Private Key Authentication**: Support for SSH keys

## Security Audits

We welcome security audits of Termiaxial. Please follow the vulnerability reporting process above.

## Credits

We recognize and credit security researchers who help make Termiaxial more secure.

### Hall of Fame
- *To be filled with first security researchers*

## Additional Resources

- [SECURITY.md on GitHub](https://docs.github.com/en/code-security/securing-your-software-supply-chain/introduction-to-supply-chain-security)
- [Responsible Disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure)

---

**Thank you for helping keep Termiaxial secure!** 🔒
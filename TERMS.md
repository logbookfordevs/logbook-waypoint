# Terms and Conditions

**Effective Date: August 10, 2026**

## 1. Acceptance of Terms

By installing, accessing, or using Logbook Waypoint (the "Software"), including the browser extension and the `@logbookfordevs/waypoint` npm package, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, do not use the Software.

## 2. License Grant

Logbook Waypoint is licensed under the MIT License. Subject to your compliance with these terms, you are granted a non-exclusive, worldwide, royalty-free license to use, copy, modify, and distribute the Software in accordance with the MIT License terms.

## 3. Description of Service

Logbook Waypoint is a developer tool that:
- Enables visual annotation of local development projects (.local, .test, .localhost, localhost) and local HTML files
- Operates exclusively on local development environments (localhost, 127.0.0.1, 0.0.0.0, *.local, *.test, *.localhost, file://)
- Integrates with AI coding agents via Model Context Protocol (MCP)
- Stores annotation data locally on your machine

## 4. Privacy and Data Collection

### 4.1 Data Storage
- All annotation data is stored locally on your machine in `~/.logbook-waypoint/`
- The Chrome extension uses Chrome Storage API for local data persistence
- No data is transmitted to external servers or third parties

### 4.2 Network Communications
- The extension communicates only with your local server (port 3846)
- The extension may read version compatibility from the local server health endpoint
- The server does not automatically contact package registries or release services
- No user data, annotations, or code is transmitted externally

### 4.3 Permissions
The Chrome extension requires minimal permissions:
- `activeTab`: To annotate the current webpage
- `storage`: To persist annotations locally
- `scripting`: To register extension content scripts and run the read-only Source Identity probe for the current Target

## 5. Acceptable Use

You agree to use Logbook Waypoint only for:
- Legitimate software development purposes
- Annotating your own projects or projects you have permission to modify
- Integration with authorized AI coding agents

You agree NOT to use Logbook Waypoint for:
- Unauthorized access to systems or data
- Malicious purposes or security exploitation
- Annotating production websites or third-party services
- Any illegal or harmful activities

## 6. Disclaimer of Warranties

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. THE AUTHORS OR COPYRIGHT HOLDERS SHALL NOT BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY ARISING FROM THE USE OF THE SOFTWARE.

## 7. Limitation of Liability

In no event shall the original authors, Logbook for Devs maintainers, or contributors be liable for any:
- Direct, indirect, incidental, special, or consequential damages
- Loss of data, profits, or business interruption
- Code changes made by AI agents based on annotations
- Issues arising from integration with third-party AI coding tools

Your use of AI coding agents to implement annotation fixes is at your own risk. Always review code changes before committing.

## 8. AI Integration Disclaimer

### 8.1 Third-Party AI Services
Logbook Waypoint facilitates integration with AI coding agents (Claude Code, Cursor, Windsurf, etc.) but:
- Does not control or endorse these services
- Is not responsible for AI-generated code quality or accuracy
- Recommends reviewing all AI-implemented changes

### 8.2 Code Responsibility
You remain fully responsible for:
- Code changes implemented based on annotations
- Testing and validating AI-generated fixes
- Maintaining code quality and security standards

## 9. Updates and Modifications

### 9.1 Software Updates
- Chrome extension updates are distributed via Chrome Web Store
- Server package updates are distributed via NPM
- Compatibility notices are derived only from the local server health response; installation remains user-controlled
- We reserve the right to modify or discontinue the Software

### 9.2 Terms Updates
We may update these Terms and Conditions. Continued use after changes constitutes acceptance of the new terms.

## 10. Open Source Contributions

By contributing to Logbook Waypoint on GitHub, you:
- Grant us a perpetual, worldwide, royalty-free license to use your contributions
- Represent that you have the right to grant such license
- Agree your contributions will be licensed under the MIT License

## 11. Intellectual Property

- Logbook Waypoint name and original brand assets are property of Leonardo Reis Dias / Logbook for Devs
- The original Vibe Annotations name and visual identity remain the property of their respective owner
- Third-party libraries and dependencies retain their respective licenses
- Your annotation data and code remain your property

## 12. Termination

These terms remain in effect until terminated. You may terminate by uninstalling the Software and deleting all copies. We may terminate your license if you violate these terms.

## 13. Governing Law

These Terms shall be governed by the laws of the jurisdiction in which the copyright holder resides, without regard to conflict of law provisions.

## 14. Severability

If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.

## 15. Contact Information

For questions about these Terms and Conditions:
- GitHub Issues: https://github.com/logbookfordevs/logbook-waypoint/issues
- Maintainer: Leonardo Reis Dias / Logbook for Devs

## 16. Acknowledgment

By using Logbook Waypoint, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.

---

*Last Updated: August 11, 2025*
*Version: 1.0*

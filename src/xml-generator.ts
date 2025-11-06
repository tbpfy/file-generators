import { createWriteStream, WriteStream } from 'fs';
import { join } from 'path';

interface XMLGeneratorConfig {
  filename: string;
  totalRecords: number;
  format: 'burp' | 'nessus' | 'generic' | 'project' | 'deep-nested';
  options?: {
    rootElement?: string;
    includeAttributes?: boolean;
    includeCDATA?: boolean;
    nestingDepth?: number;
  };
}

interface BurpIssue {
  serialNumber: string;
  type: string;
  name: string;
  host: string;
  ip: string;
  path: string;
  location: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: 'Tentative' | 'Firm' | 'Certain';
  issueBackground: string;
  issueDetail: string;
  requestMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  responseStatus: string;
}

interface NessusItem {
  port: number;
  protocol: 'tcp' | 'udp';
  severity: '0' | '1' | '2' | '3' | '4';
  pluginID: string;
  pluginName: string;
  description: string;
  solution: string;
  riskFactor: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
}

/**
 * XMLGenerator - Streaming XML file generator
 * 
 * This generator uses Node.js WriteStream to directly write XML content to disk,
 * bypassing the string length limitation (~500MB-1GB depending on system).
 * This allows generation of files 3GB+ without memory constraints.
 * 
 * All generator methods write directly to the stream instead of building
 * large strings in memory, making it suitable for generating massive datasets.
 * 
 * Implements proper backpressure handling to prevent memory buildup during
 * large file generation.
 */
class XMLGenerator {
  /**
   * Write to stream and handle backpressure.
   * Returns a promise that resolves when it's safe to continue writing.
   */
  private async writeWithBackpressure(stream: WriteStream, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!stream.write(data)) {
        // Buffer is full, wait for drain event
        stream.once('drain', resolve);
        stream.once('error', reject);
      } else {
        // Buffer has space, can continue immediately
        resolve();
      }
    });
  }

  private generateUniqueId(): string {
    return Math.floor(Math.random() * 9000000000000000000 + 1000000000000000000).toString();
  }

  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`;
  }

  private generateRandomMAC(): string {
    return Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()
    ).join(':');
  }

  private getRandomChoice<T>(choices: T[]): T {
    return choices[Math.floor(Math.random() * choices.length)];
  }

  private generateBurpIssue(): BurpIssue {
    const vulnerabilityTypes = [
      'SQL injection',
      'XSS vulnerability',
      'Command injection',
      'Open Redirect',
      'CSRF vulnerability',
      'Information disclosure',
      'Authentication bypass',
      'Directory traversal',
    ];

    const domains = ['example.com', 'testsite.org', 'webapp.net', 'api.service.com'];
    const paths = ['/api', '/search', '/login', '/users', '/admin', '/dashboard'];
    const parameters = ['id', 'q', 'user', 'token', 'search', 'filter'];

    const vulnType = this.getRandomChoice(vulnerabilityTypes);
    const domain = this.getRandomChoice(domains);
    const path = this.getRandomChoice(paths);
    const parameter = this.getRandomChoice(parameters);

    return {
      serialNumber: this.generateUniqueId(),
      type: Math.floor(Math.random() * 1000000 + 7000000).toString(),
      name: vulnType,
      host: `https://${domain}`,
      ip: this.generateRandomIP(),
      path: path,
      location: `${path}?${parameter}=${Math.floor(Math.random() * 100)}`,
      severity: this.getRandomChoice(['Low', 'Medium', 'High', 'Critical']),
      confidence: this.getRandomChoice(['Tentative', 'Firm', 'Certain']),
      issueBackground: `${vulnType} found in application`,
      issueDetail: `Parameter ${parameter} is vulnerable to ${vulnType}`,
      requestMethod: this.getRandomChoice(['GET', 'POST', 'PUT', 'DELETE']),
      responseStatus: this.getRandomChoice([
        '200 OK',
        '302 Found',
        '403 Forbidden',
        '500 Internal Server Error',
      ]),
    };
  }

  private generateNessusItem(): NessusItem {
    const pluginNames = [
      'Target Credential Status by Authentication Protocol',
      'SSH Rate Limited Device',
      'SSL Certificate Verification',
      'HTTP Server Security Headers',
      'Weak Cipher Suites',
      'Operating System Detection',
      'Service Detection',
    ];

    return {
      port: Math.floor(Math.random() * 65535) + 1,
      protocol: this.getRandomChoice(['tcp', 'udp']),
      severity: this.getRandomChoice(['0', '1', '2', '3', '4']),
      pluginID: Math.floor(Math.random() * 900000 + 100000).toString(),
      pluginName: this.getRandomChoice(pluginNames),
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      solution: 'Update the affected software to the latest version or apply vendor patches.',
      riskFactor: this.getRandomChoice(['None', 'Low', 'Medium', 'High', 'Critical']),
    };
  }

  private async generateBurpXML(stream: WriteStream, config: XMLGeneratorConfig): Promise<void> {
    const timestamp = new Date().toUTCString();
    const burpVersion = '2024.12.5';

    stream.write(`<?xml version="1.0" encoding="UTF-8"?>\n`);
    stream.write(`<issues burpVersion="${burpVersion}" exportTime="${timestamp}">\n`);

    for (let i = 0; i < config.totalRecords; i++) {
      const issue = this.generateBurpIssue();

      stream.write(`  <issue>\n`);
      stream.write(`    <serialNumber>${issue.serialNumber}</serialNumber>\n`);
      stream.write(`    <type>${issue.type}</type>\n`);
      stream.write(`    <name><![CDATA[${issue.name}]]></name>\n`);
      stream.write(`    <host ip="${issue.ip}">${issue.host}</host>\n`);
      stream.write(`    <path><![CDATA[${issue.path}]]></path>\n`);
      stream.write(`    <location><![CDATA[${issue.location}]]></location>\n`);
      stream.write(`    <severity>${issue.severity}</severity>\n`);
      stream.write(`    <confidence>${issue.confidence}</confidence>\n`);
      stream.write(`    <issueBackground><![CDATA[${issue.issueBackground}]]></issueBackground>\n`);
      stream.write(`    <issueDetail><![CDATA[${issue.issueDetail}]]></issueDetail>\n`);

      // Add deeply nested vulnerability analysis
      stream.write(`    <analysis>\n`);
      stream.write(`      <classification>\n`);
      stream.write(`        <category type="primary">${this.getRandomChoice(['injection', 'xss', 'csrf', 'auth'])}</category>\n`);
      stream.write(`        <subcategory>\n`);
      stream.write(`          <level1>${this.getRandomChoice(['sql', 'nosql', 'ldap', 'xpath'])}</level1>\n`);
      stream.write(`          <level2>\n`);
      stream.write(`            <technique>${this.getRandomChoice(['union', 'boolean', 'time', 'error'])}</technique>\n`);
      stream.write(`            <complexity level="${this.getRandomChoice(['low', 'medium', 'high'])}">\n`);
      stream.write(`              <factors>\n`);
      stream.write(`                <authentication required="${Math.random() > 0.5}">${this.getRandomChoice(['none', 'basic', 'session'])}</authentication>\n`);
      stream.write(`                <privileges>${this.getRandomChoice(['anonymous', 'user', 'admin'])}</privileges>\n`);
      stream.write(`                <network>\n`);
      stream.write(`                  <access>${this.getRandomChoice(['local', 'adjacent', 'network'])}</access>\n`);
      stream.write(`                  <encryption>${Math.random() > 0.3}</encryption>\n`);
      stream.write(`                </network>\n`);
      stream.write(`              </factors>\n`);
      stream.write(`            </complexity>\n`);
      stream.write(`          </level2>\n`);
      stream.write(`        </subcategory>\n`);
      stream.write(`      </classification>\n`);
      stream.write(`      <impact>\n`);
      stream.write(`        <confidentiality score="${Math.floor(Math.random() * 10)}">\n`);
      stream.write(`          <dataTypes>\n`);
      stream.write(`            <type sensitive="${Math.random() > 0.5}">user_data</type>\n`);
      stream.write(`            <type sensitive="${Math.random() > 0.5}">system_config</type>\n`);
      stream.write(`          </dataTypes>\n`);
      stream.write(`        </confidentiality>\n`);
      stream.write(`        <integrity score="${Math.floor(Math.random() * 10)}" />\n`);
      stream.write(`        <availability score="${Math.floor(Math.random() * 10)}" />\n`);
      stream.write(`      </impact>\n`);
      stream.write(`    </analysis>\n`);

      stream.write(`    <requestresponse>\n`);
      stream.write(`      <request method="${issue.requestMethod}" base64="false"><![CDATA[${issue.requestMethod} ${issue.location} HTTP/1.1]]></request>\n`);
      stream.write(`      <response base64="false"><![CDATA[HTTP/1.1 ${issue.responseStatus}]]></response>\n`);
      stream.write(`    </requestresponse>\n`);
      stream.write(`  </issue>\n`);

      // Handle backpressure every 1000 records
      if (i % 1000 === 0 && i > 0) {
        await this.writeWithBackpressure(stream, '');
        if (i % 100000 === 0) {
          console.info(`  Progress: ${i.toLocaleString()} / ${config.totalRecords.toLocaleString()} records (${((i / config.totalRecords) * 100).toFixed(1)}%)`);
        }
      }
    }

    stream.write(`</issues>\n`);
  }

  private async generateNessusXML(stream: WriteStream, config: XMLGeneratorConfig): Promise<void> {
    const hostIP = this.generateRandomIP();
    const macAddress = this.generateRandomMAC();

    stream.write(`<?xml version="1.0" encoding="UTF-8"?>\n`);
    stream.write(`<NessusClientData_v2>\n`);
    stream.write(`  <Report name="Security_Scan" xmlns:cm="http://www.nessus.org/cm">\n`);
    stream.write(`    <ReportHost name="${hostIP}">\n`);
    stream.write(`      <HostProperties>\n`);
    stream.write(`        <tag name="mac-address">${macAddress}</tag>\n`);
    stream.write(`        <tag name="host-ip">${hostIP}</tag>\n`);
    stream.write(`        <tag name="operating-system">Linux Ubuntu 20.04</tag>\n`);
    stream.write(`        <tag name="system-type">general-purpose</tag>\n`);
    stream.write(`        <tag name="Credentialed_Scan">true</tag>\n`);
    stream.write(`      </HostProperties>\n\n`);

    for (let i = 0; i < config.totalRecords; i++) {
      const item = this.generateNessusItem();

      stream.write(`      <ReportItem port="${item.port}" protocol="${item.protocol}" severity="${item.severity}" `);
      stream.write(`pluginID="${item.pluginID}" pluginName="${item.pluginName}">\n`);
      stream.write(`        <description>${item.description}</description>\n`);
      stream.write(`        <solution>${item.solution}</solution>\n`);
      stream.write(`        <risk_factor>${item.riskFactor}</risk_factor>\n`);
      stream.write(`        <plugin_output>Detected service on port ${item.port}/${item.protocol}</plugin_output>\n`);
      stream.write(`      </ReportItem>\n`);

      // Handle backpressure every 1000 records
      if (i % 1000 === 0 && i > 0) {
        await this.writeWithBackpressure(stream, '');
        if (i % 100000 === 0) {
          console.info(`  Progress: ${i.toLocaleString()} / ${config.totalRecords.toLocaleString()} records (${((i / config.totalRecords) * 100).toFixed(1)}%)`);
        }
      }
    }

    stream.write(`    </ReportHost>\n`);
    stream.write(`  </Report>\n`);
    stream.write(`</NessusClientData_v2>\n`);
  }

  private async generateGenericXML(stream: WriteStream, config: XMLGeneratorConfig): Promise<void> {
    const rootElement = config.options?.rootElement || 'data';
    const includeAttributes = config.options?.includeAttributes ?? true;
    const includeCDATA = config.options?.includeCDATA ?? false;

    stream.write(`<?xml version="1.0" encoding="UTF-8"?>\n`);
    stream.write(`<${rootElement}${includeAttributes ? ` version="1.0" generated="${new Date().toISOString()}"` : ''}>\n`);

    for (let i = 0; i < config.totalRecords; i++) {
      stream.write(`  <record id="${i + 1}"${includeAttributes ? ` index="${i}"` : ''}>\n`);
      stream.write(`    <name>${includeCDATA ? '<![CDATA[' : ''}Record_${i.toString().padStart(6, '0')}${includeCDATA ? ']]>' : ''}</name>\n`);
      stream.write(`    <value>${Math.floor(Math.random() * 1000)}</value>\n`);
      stream.write(`    <category>${this.getRandomChoice(['A', 'B', 'C', 'D'])}</category>\n`);
      stream.write(`    <active>${Math.random() > 0.5}</active>\n`);
      stream.write(`    <metadata>\n`);
      stream.write(`      <created>${new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()}</created>\n`);
      stream.write(`      <tags>\n`);
      stream.write(`        <tag>tag_${i % 5}</tag>\n`);
      stream.write(`        <tag>category_${this.getRandomChoice(['alpha', 'beta', 'gamma'])}</tag>\n`);
      stream.write(`      </tags>\n`);
      stream.write(`    </metadata>\n`);
      stream.write(`  </record>\n`);

      // Handle backpressure every 1000 records
      if (i % 1000 === 0 && i > 0) {
        await this.writeWithBackpressure(stream, '');
        if (i % 100000 === 0) {
          console.info(`  Progress: ${i.toLocaleString()} / ${config.totalRecords.toLocaleString()} records (${((i / config.totalRecords) * 100).toFixed(1)}%)`);
        }
      }
    }

    stream.write(`</${rootElement}>\n`);
  }

  private async generateProjectXML(stream: WriteStream, config: XMLGeneratorConfig): Promise<void> {
    stream.write(`<?xml version="1.0" encoding="UTF-8"?>\n`);
    stream.write(`<project version="1.0" type="FEDRAMP_REV_5">\n`);
    stream.write(`  <meta>\n`);
    stream.write(`    <name><![CDATA[Test Security Project]]></name>\n`);
    stream.write(`    <color>#3B82F6</color>\n`);
    stream.write(`    <printApplicability>true</printApplicability>\n`);
    stream.write(`    <cannedText>false</cannedText>\n`);
    stream.write(`  </meta>\n`);
    stream.write(`  <system>\n`);
    stream.write(`    <systemName><![CDATA[Test Information System]]></systemName>\n`);
    stream.write(`    <systemShortName>TIS</systemShortName>\n`);
    stream.write(`    <packageId>TIS-${this.generateUniqueId().slice(0, 8)}</packageId>\n`);
    stream.write(`    <authorizationType>ATO</authorizationType>\n`);
    stream.write(`    <status>OPERATIONAL</status>\n`);
    stream.write(`  </system>\n`);
    stream.write(`  <controls>\n`);

    for (let i = 0; i < config.totalRecords; i++) {
      const controlId = `AC-${(i + 1).toString().padStart(2, '0')}`;
      stream.write(`    <control id="${controlId}">\n`);
      stream.write(`      <title><![CDATA[Access Control ${i + 1}]]></title>\n`);
      stream.write(`      <description><![CDATA[This control addresses access control requirements for the system.]]></description>\n`);
      stream.write(`      <implementationStatus>${this.getRandomChoice(['IMPLEMENTED', 'PARTIALLY_IMPLEMENTED', 'PLANNED', 'NOT_APPLICABLE'])}</implementationStatus>\n`);
      stream.write(`      <requirements>\n`);
      stream.write(`        <requirement id="${controlId}-1">\n`);
      stream.write(`          <statement><![CDATA[The system shall implement access control policies.]]></statement>\n`);
      stream.write(`          <implementationGuidance><![CDATA[Implement role-based access control mechanisms.]]></implementationGuidance>\n`);
      stream.write(`        </requirement>\n`);
      stream.write(`      </requirements>\n`);
      stream.write(`    </control>\n`);

      // Handle backpressure every 1000 records
      if (i % 1000 === 0 && i > 0) {
        await this.writeWithBackpressure(stream, '');
      }
    }

    stream.write(`  </controls>\n`);
    stream.write(`</project>\n`);
  }

  private async generateDeepNestedXML(stream: WriteStream, config: XMLGeneratorConfig): Promise<void> {
    stream.write(`<?xml version="1.0" encoding="UTF-8"?>\n`);
    stream.write(`<organization id="ORG-${this.generateUniqueId().slice(0, 8)}" type="enterprise">\n`);
    stream.write(`  <metadata created="${new Date().toISOString()}" version="2.1">\n`);
    stream.write(`    <generator>XML Deep Nesting Generator</generator>\n`);
    stream.write(`    <description><![CDATA[Complex hierarchical data with multiple navigation paths]]></description>\n`);
    stream.write(`  </metadata>\n`);

    for (let i = 0; i < config.totalRecords; i++) {
      const deptId = `DEPT-${i.toString().padStart(3, '0')}`;
      stream.write(`  <departments>\n`);
      stream.write(`    <department id="${deptId}" active="${Math.random() > 0.2}">\n`);
      stream.write(`      <info>\n`);
      stream.write(`        <name><![CDATA[${this.getRandomChoice(['Engineering', 'Security', 'Operations', 'Finance', 'Legal', 'HR'])} Department ${i + 1}]]></name>\n`);
      stream.write(`        <location>\n`);
      stream.write(`          <building>${this.getRandomChoice(['North', 'South', 'East', 'West'])} Building</building>\n`);
      stream.write(`          <floor level="${Math.floor(Math.random() * 20) + 1}">\n`);
      stream.write(`            <zones>\n`);
      stream.write(`              <zone type="restricted" clearance="${this.getRandomChoice(['PUBLIC', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'])}">\n`);
      stream.write(`                <access>\n`);
      stream.write(`                  <methods>\n`);
      stream.write(`                    <method type="card" required="true">\n`);
      stream.write(`                      <validation>\n`);
      stream.write(`                        <primary algorithm="AES256">${this.generateUniqueId().slice(0, 16)}</primary>\n`);
      stream.write(`                        <secondary algorithm="RSA2048">${this.generateUniqueId().slice(0, 32)}</secondary>\n`);
      stream.write(`                        <biometric>\n`);
      stream.write(`                          <fingerprint enabled="${Math.random() > 0.3}" />\n`);
      stream.write(`                          <retinal enabled="${Math.random() > 0.7}" />\n`);
      stream.write(`                          <facial enabled="${Math.random() > 0.5}" />\n`);
      stream.write(`                        </biometric>\n`);
      stream.write(`                      </validation>\n`);
      stream.write(`                    </method>\n`);
      stream.write(`                  </methods>\n`);
      stream.write(`                </access>\n`);
      stream.write(`              </zone>\n`);
      stream.write(`            </zones>\n`);
      stream.write(`          </floor>\n`);
      stream.write(`        </location>\n`);
      stream.write(`      </info>\n`);

      // Personnel branch
      stream.write(`      <personnel>\n`);
      stream.write(`        <management>\n`);
      stream.write(`          <directors>\n`);
      stream.write(`            <director id="DIR-${i}-1" level="senior">\n`);
      stream.write(`              <profile>\n`);
      stream.write(`                <personal>\n`);
      stream.write(`                  <name>Director ${i + 1}</name>\n`);
      stream.write(`                  <clearance level="${this.getRandomChoice(['SECRET', 'TOP_SECRET'])}">\n`);
      stream.write(`                    <validations>\n`);
      stream.write(`                      <background completed="${new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}" />\n`);
      stream.write(`                      <polygraph status="${this.getRandomChoice(['PASSED', 'PENDING', 'FAILED'])}" />\n`);
      stream.write(`                    </validations>\n`);
      stream.write(`                  </clearance>\n`);
      stream.write(`                </personal>\n`);
      stream.write(`                <access>\n`);
      stream.write(`                  <systems>\n`);
      stream.write(`                    <system name="financial" permissions="read,write,delete" />\n`);
      stream.write(`                    <system name="hr" permissions="read,write" />\n`);
      stream.write(`                    <system name="security" permissions="read" />\n`);
      stream.write(`                  </systems>\n`);
      stream.write(`                </access>\n`);
      stream.write(`              </profile>\n`);
      stream.write(`            </director>\n`);
      stream.write(`          </directors>\n`);
      stream.write(`        </management>\n`);
      stream.write(`      </personnel>\n`);

      // Technology branch
      stream.write(`      <technology>\n`);
      stream.write(`        <infrastructure>\n`);
      stream.write(`          <networks>\n`);
      stream.write(`            <network type="production" vlan="${Math.floor(Math.random() * 4000) + 100}">\n`);
      stream.write(`              <subnets>\n`);
      stream.write(`                <subnet cidr="${this.generateRandomIP()}/24">\n`);
      stream.write(`                  <security>\n`);
      stream.write(`                    <firewall>\n`);
      stream.write(`                      <rules>\n`);
      stream.write(`                        <rule id="FW-${i}-${Math.floor(Math.random() * 100)}" action="${this.getRandomChoice(['ALLOW', 'DENY', 'LOG'])}">\n`);
      stream.write(`                          <source>\n`);
      stream.write(`                            <ip>${this.generateRandomIP()}</ip>\n`);
      stream.write(`                            <ports>\n`);
      stream.write(`                              <port protocol="tcp">${Math.floor(Math.random() * 65535) + 1}</port>\n`);
      stream.write(`                              <port protocol="udp">${Math.floor(Math.random() * 65535) + 1}</port>\n`);
      stream.write(`                            </ports>\n`);
      stream.write(`                          </source>\n`);
      stream.write(`                          <destination>\n`);
      stream.write(`                            <ip>${this.generateRandomIP()}</ip>\n`);
      stream.write(`                            <services>\n`);
      stream.write(`                              <service name="${this.getRandomChoice(['HTTP', 'HTTPS', 'SSH', 'FTP', 'SMTP'])}" port="${Math.floor(Math.random() * 65535) + 1}" />\n`);
      stream.write(`                            </services>\n`);
      stream.write(`                          </destination>\n`);
      stream.write(`                        </rule>\n`);
      stream.write(`                      </rules>\n`);
      stream.write(`                    </firewall>\n`);
      stream.write(`                  </security>\n`);
      stream.write(`                </subnet>\n`);
      stream.write(`              </subnets>\n`);
      stream.write(`            </network>\n`);
      stream.write(`          </networks>\n`);
      stream.write(`        </infrastructure>\n`);
      stream.write(`      </technology>\n`);

      // Compliance branch
      stream.write(`      <compliance>\n`);
      stream.write(`        <frameworks>\n`);
      stream.write(`          <framework name="${this.getRandomChoice(['SOC2', 'ISO27001', 'NIST', 'FEDRAMP'])}" version="2.0">\n`);
      stream.write(`            <controls>\n`);
      stream.write(`              <control id="CTRL-${i}-${Math.floor(Math.random() * 50)}" status="${this.getRandomChoice(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL'])}">\n`);
      stream.write(`                <evidence>\n`);
      stream.write(`                  <documents>\n`);
      stream.write(`                    <document type="policy" classification="${this.getRandomChoice(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'])}">\n`);
      stream.write(`                      <metadata>\n`);
      stream.write(`                        <created>${new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()}</created>\n`);
      stream.write(`                        <version>${Math.floor(Math.random() * 10) + 1}.${Math.floor(Math.random() * 10)}</version>\n`);
      stream.write(`                        <approvals>\n`);
      stream.write(`                          <approval role="manager" date="${new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}" />\n`);
      stream.write(`                          <approval role="legal" date="${new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}" />\n`);
      stream.write(`                        </approvals>\n`);
      stream.write(`                      </metadata>\n`);
      stream.write(`                    </document>\n`);
      stream.write(`                  </documents>\n`);
      stream.write(`                </evidence>\n`);
      stream.write(`              </control>\n`);
      stream.write(`            </controls>\n`);
      stream.write(`          </framework>\n`);
      stream.write(`        </frameworks>\n`);
      stream.write(`      </compliance>\n`);

      stream.write(`    </department>\n`);
      stream.write(`  </departments>\n`);

      // Handle backpressure every 1000 records
      if (i % 1000 === 0 && i > 0) {
        await this.writeWithBackpressure(stream, '');
        if (i % 100000 === 0) {
          console.info(`  Progress: ${i.toLocaleString()} / ${config.totalRecords.toLocaleString()} records (${((i / config.totalRecords) * 100).toFixed(1)}%)`);
        }
      }
    }

    stream.write(`</organization>\n`);
  }

  async generate(config: XMLGeneratorConfig): Promise<void> {
    const filePath = join(process.cwd(), 'generated', config.filename);
    const stream = createWriteStream(filePath, { encoding: 'utf8' });

    const startTime = Date.now();
    
    console.info(`Generating ${config.format} XML file with ${config.totalRecords.toLocaleString()} records...`);

    try {
      switch (config.format) {
        case 'burp':
          await this.generateBurpXML(stream, config);
          break;
        case 'nessus':
          await this.generateNessusXML(stream, config);
          break;
        case 'project':
          await this.generateProjectXML(stream, config);
          break;
        case 'deep-nested':
          await this.generateDeepNestedXML(stream, config);
          break;
        case 'generic':
        default:
          await this.generateGenericXML(stream, config);
          break;
      }

      // Wait for stream to finish
      await new Promise<void>((resolve, reject) => {
        stream.end(() => {
          const endTime = Date.now();
          const fileSizeKB = stream.bytesWritten / 1024;
          const fileSizeMB = fileSizeKB / 1024;
          const fileSizeGB = fileSizeMB / 1024;
          const duration = ((endTime - startTime) / 1000).toFixed(2);

          console.info(`\nXML file generated: ${filePath}`);
          console.info(`Format: ${config.format}`);
          console.info(`Records: ${config.totalRecords.toLocaleString()}`);
          
          if (fileSizeGB >= 1) {
            console.info(`File size: ${fileSizeGB.toFixed(2)} GB`);
          } else if (fileSizeMB >= 1) {
            console.info(`File size: ${fileSizeMB.toFixed(2)} MB`);
          } else {
            console.info(`File size: ${Math.round(fileSizeKB)} KB`);
          }
          
          console.info(`Generation time: ${duration}s`);
          resolve();
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Error generating XML:', error);
      throw error;
    }
  }
}

function createBurpConfig(): XMLGeneratorConfig {
  return {
    filename: 'test-burp-scan.xml',
    totalRecords: 50,
    format: 'burp',
  };
}

function createLargeBurpConfig(): XMLGeneratorConfig {
  return {
    filename: 'large-burp-scan.xml',
    totalRecords: 180000,
    format: 'burp',
  };
}

function createNessusConfig(): XMLGeneratorConfig {
  return {
    filename: 'test-nessus-scan.xml',
    totalRecords: 100,
    format: 'nessus',
  };
}

function createLargeNessusConfig(): XMLGeneratorConfig {
  return {
    filename: 'large-nessus-scan.xml',
    totalRecords: 26_200,
    format: 'nessus',
  };
}

function createGenericConfig(): XMLGeneratorConfig {
  return {
    filename: 'test-generic-data.xml',
    totalRecords: 25,
    format: 'generic',
    options: {
      rootElement: 'testData',
      includeAttributes: true,
      includeCDATA: true,
    },
  };
}

function createLargeGenericConfig(): XMLGeneratorConfig {
  return {
    filename: 'large-generic-data.xml',
    totalRecords: 413000,
    format: 'generic',
    options: {
      rootElement: 'largeTestData',
      includeAttributes: true,
      includeCDATA: true,
    },
  };
}

function createProjectConfig(): XMLGeneratorConfig {
  return {
    filename: 'test-project-controls.xml',
    totalRecords: 20,
    format: 'project',
  };
}

function createDeepNestedConfig(): XMLGeneratorConfig {
  return {
    filename: 'test-deep-nested.xml',
    totalRecords: 10,
    format: 'deep-nested',
  };
}

function createLargeDeepNestedConfig(): XMLGeneratorConfig {
  return {
    filename: 'large-deep-nested.xml',
    totalRecords: 32500,
    format: 'deep-nested',
  };
}

function createUltraLargeBurpConfig(): XMLGeneratorConfig {
  return {
    filename: 'ultra-large-burp-scan.xml',
    totalRecords: 4200000, // ~3.2GB
    format: 'burp',
  };
}

function createUltraLargeNessusConfig(): XMLGeneratorConfig {
  return {
    filename: 'ultra-large-nessus-scan.xml',
    totalRecords: 6100000, // ~3.2GB
    format: 'nessus',
  };
}

function createUltraLargeGenericConfig(): XMLGeneratorConfig {
  return {
    filename: 'ultra-large-generic-data.xml',
    totalRecords: 9600000, // ~3.2GB
    format: 'generic',
    options: {
      rootElement: 'ultraLargeTestData',
      includeAttributes: true,
      includeCDATA: true,
    },
  };
}

function createUltraLargeDeepNestedConfig(): XMLGeneratorConfig {
  return {
    filename: 'ultra-large-deep-nested.xml',
    totalRecords: 800000, // ~3.2GB with deep nesting (4KB per record)
    format: 'deep-nested',
  };
}

async function main() {
  const generator = new XMLGenerator();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.info('XML Test Data Generator');
    console.info('');
    console.info('Generates various XML test files for security assessments and testing');
    console.info('');
    console.info('Usage:');
    console.info('  npx tsx src/xml-generator.ts [format]');
    console.info('');
    console.info('Available formats:');
    console.info('  burp        - Burp Suite security scan format (50 issues)');
    console.info('  nessus      - Nessus vulnerability scan format (100 items)');
    console.info('  generic     - Generic XML with nested elements (25 records)');
    console.info('  project     - Security project controls format (20 controls)');
    console.info('  deep-nested - Complex hierarchical structure (10 departments)');
    console.info('  all         - Generate all formats');
    console.info('');
    console.info('Large formats (~13MB each):');
    console.info('  burp-large        - Large Burp Suite scan (18,000 issues)');
    console.info('  nessus-large      - Large Nessus scan (26,200 items)');
    console.info('  generic-large     - Large generic XML (41,300 records)');
    console.info('  deep-nested-large - Large deep hierarchy (3,250 departments)');
    console.info('');
    console.info('Ultra-large formats (~3.2GB each - uses streaming):');
    console.info('  burp-ultra        - Ultra-large Burp Suite scan (4.2M issues)');
    console.info('  nessus-ultra      - Ultra-large Nessus scan (6.1M items)');
    console.info('  generic-ultra     - Ultra-large generic XML (9.6M records)');
    console.info('  deep-nested-ultra - Ultra-large deep hierarchy (800K departments)');
    console.info('');
    console.info('Examples:');
    console.info('  npx tsx src/xml-generator.ts burp');
    console.info('  npx tsx src/xml-generator.ts all');
    console.info('  npx tsx src/xml-generator.ts burp-ultra');
    console.info('');
    return;
  }

  const format = args[0].toLowerCase();

  switch (format) {
    case 'burp':
      await generator.generate(createBurpConfig());
      break;
    case 'nessus':
      await generator.generate(createNessusConfig());
      break;
    case 'generic':
      await generator.generate(createGenericConfig());
      break;
    case 'project':
      await generator.generate(createProjectConfig());
      break;
    case 'burp-large':
      await generator.generate(createLargeBurpConfig());
      break;
    case 'nessus-large':
      await generator.generate(createLargeNessusConfig());
      break;
    case 'generic-large':
      await generator.generate(createLargeGenericConfig());
      break;
    case 'deep-nested':
      await generator.generate(createDeepNestedConfig());
      break;
    case 'deep-nested-large':
      await generator.generate(createLargeDeepNestedConfig());
      break;
    case 'burp-ultra':
      await generator.generate(createUltraLargeBurpConfig());
      break;
    case 'nessus-ultra':
      await generator.generate(createUltraLargeNessusConfig());
      break;
    case 'generic-ultra':
      await generator.generate(createUltraLargeGenericConfig());
      break;
    case 'deep-nested-ultra':
      await generator.generate(createUltraLargeDeepNestedConfig());
      break;
    case 'all':
      await generator.generate(createBurpConfig());
      await generator.generate(createNessusConfig());
      await generator.generate(createGenericConfig());
      await generator.generate(createProjectConfig());
      await generator.generate(createDeepNestedConfig());
      break;
    case 'all-large':
      await generator.generate(createLargeBurpConfig());
      await generator.generate(createLargeNessusConfig());
      await generator.generate(createLargeGenericConfig());
      await generator.generate(createLargeDeepNestedConfig());
      break;
    case 'all-ultra':
      console.warn('⚠️  Warning: Generating all ultra-large files will create ~12.8GB of data!');
      await generator.generate(createUltraLargeBurpConfig());
      await generator.generate(createUltraLargeNessusConfig());
      await generator.generate(createUltraLargeGenericConfig());
      await generator.generate(createUltraLargeDeepNestedConfig());
      break;
    default:
      console.error(`Unknown format: ${format}`);
      console.info(
        'Available formats: burp, nessus, generic, project, deep-nested, burp-large, nessus-large, generic-large, deep-nested-large, burp-ultra, nessus-ultra, generic-ultra, deep-nested-ultra, all, all-large, all-ultra'
      );
      process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { XMLGenerator, type XMLGeneratorConfig };

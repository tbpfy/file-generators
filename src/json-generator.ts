import { createWriteStream } from "fs";
import * as path from "path";

interface JSONGeneratorConfig {
  filename: string;
  totalRecords: number;
  format:
    | "organization"
    | "vulnerability-assessment"
    | "compliance-framework"
    | "nested-scan"
    | "simple-severity";
  options?: {
    maxDepth?: number;
    includeArrays?: boolean;
    includeNulls?: boolean;
    generateUUIDs?: boolean;
  };
}

class JSONGenerator {
  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private generateObjectId(): string {
    return (
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0") +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0") +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0") +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")
    );
  }

  private generateRandomIP(): string {
    return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(
      Math.random() * 256
    )}.${Math.floor(Math.random() * 256)}.${
      Math.floor(Math.random() * 254) + 1
    }`;
  }

  private getRandomChoice<T>(choices: T[]): T {
    return choices[Math.floor(Math.random() * choices.length)];
  }

  private generateRandomDate(daysBack: number = 365): string {
    const date = new Date(
      Date.now() - Math.random() * daysBack * 24 * 60 * 60 * 1000
    );
    return date.toISOString();
  }

  private generateOrganizationRecord(index: number): any {
    const departmentTypes = [
      "Engineering",
      "Security",
      "Operations",
      "Finance",
      "Legal",
      "HR",
      "Marketing",
      "Sales",
    ];
    const clearanceLevels = ["PUBLIC", "CONFIDENTIAL", "SECRET", "TOP_SECRET"];
    const systemTypes = ["financial", "hr", "security", "engineering", "legal"];
    const frameworkTypes = ["SOC2", "ISO27001", "NIST", "FEDRAMP", "CMMC"];

    return {
      _id: this.generateObjectId(),
      organizationId: `ORG-${index.toString().padStart(4, "0")}`,
      metadata: {
        created: this.generateRandomDate(180),
        lastModified: this.generateRandomDate(30),
        version: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(
          Math.random() * 10
        )}`,
        source: "json-generator",
        classification: this.getRandomChoice(clearanceLevels),
      },
      departments: [
        {
          departmentId: `DEPT-${index}-001`,
          name: `${this.getRandomChoice(departmentTypes)} Department`,
          active: Math.random() > 0.1,
          hierarchy: {
            level: Math.floor(Math.random() * 5) + 1,
            parentDepartment:
              Math.random() > 0.5
                ? `DEPT-${Math.floor(Math.random() * index) || 1}-001`
                : null,
            subdepartments: Array.from(
              { length: Math.floor(Math.random() * 3) },
              (_, i) => ({
                departmentId: `DEPT-${index}-${(i + 2)
                  .toString()
                  .padStart(3, "0")}`,
                name: `${this.getRandomChoice(departmentTypes)} Subdivision ${
                  i + 1
                }`,
                personnel: {
                  headCount: Math.floor(Math.random() * 50) + 5,
                  management: {
                    directors: Array.from(
                      { length: Math.floor(Math.random() * 3) + 1 },
                      (_, dirIndex) => ({
                        directorId: `DIR-${index}-${i}-${dirIndex}`,
                        profile: {
                          personal: {
                            employeeId: `EMP-${this.generateObjectId().slice(
                              0,
                              8
                            )}`,
                            guid: this.generateUUID(),
                            security: {
                              clearance: {
                                level: this.getRandomChoice(clearanceLevels),
                                expirationDate: this.generateRandomDate(-30),
                                validations: {
                                  background: {
                                    completed: this.generateRandomDate(1095),
                                    status: this.getRandomChoice([
                                      "PASSED",
                                      "PENDING",
                                      "EXPIRED",
                                    ]),
                                    investigationType: this.getRandomChoice([
                                      "T3",
                                      "T5",
                                      "TS/SCI",
                                    ]),
                                    adjudication: {
                                      date: this.generateRandomDate(365),
                                      authority: this.getRandomChoice([
                                        "DoD CAF",
                                        "OPM",
                                        "DHS",
                                      ]),
                                      conditions:
                                        Math.random() > 0.8
                                          ? [
                                              {
                                                type: "periodic_review",
                                                frequency: "annual",
                                                nextDue:
                                                  this.generateRandomDate(-365),
                                              },
                                            ]
                                          : [],
                                    },
                                  },
                                  polygraph: {
                                    type: this.getRandomChoice([
                                      "lifestyle",
                                      "counterintelligence",
                                      "none",
                                    ]),
                                    status: this.getRandomChoice([
                                      "PASSED",
                                      "PENDING",
                                      "FAILED",
                                      "N/A",
                                    ]),
                                    lastUpdate: this.generateRandomDate(730),
                                  },
                                },
                              },
                              access: {
                                systems: systemTypes.map((sysType) => ({
                                  systemName: sysType,
                                  permissions: this.getRandomChoice([
                                    ["read"],
                                    ["read", "write"],
                                    ["read", "write", "delete"],
                                    ["admin"],
                                  ]),
                                  lastAccess: this.generateRandomDate(7),
                                  accessHistory: {
                                    totalSessions: Math.floor(
                                      Math.random() * 1000
                                    ),
                                    averageSessionDuration:
                                      Math.floor(Math.random() * 240) + 15,
                                    lastFailedAttempt:
                                      Math.random() > 0.7
                                        ? this.generateRandomDate(30)
                                        : null,
                                  },
                                })),
                                physicalAccess: {
                                  facilities: Array.from(
                                    {
                                      length: Math.floor(Math.random() * 4) + 1,
                                    },
                                    (_, facIndex) => ({
                                      facilityId: `FAC-${index}-${facIndex}`,
                                      building: `Building ${this.getRandomChoice(
                                        ["Alpha", "Beta", "Gamma", "Delta"]
                                      )}`,
                                      zones: Array.from(
                                        {
                                          length:
                                            Math.floor(Math.random() * 5) + 1,
                                        },
                                        (_, zoneIndex) => ({
                                          zoneId: `ZONE-${facIndex}-${zoneIndex}`,
                                          type: this.getRandomChoice([
                                            "open",
                                            "restricted",
                                            "secure",
                                            "vault",
                                          ]),
                                          clearanceRequired:
                                            this.getRandomChoice(
                                              clearanceLevels
                                            ),
                                          accessMethods: {
                                            cardAccess: {
                                              enabled: true,
                                              cardNumber:
                                                this.generateObjectId().slice(
                                                  0,
                                                  16
                                                ),
                                              validFrom:
                                                this.generateRandomDate(90),
                                              validUntil:
                                                this.generateRandomDate(-90),
                                              restrictions: {
                                                timeWindows: [
                                                  {
                                                    days: [
                                                      "monday",
                                                      "tuesday",
                                                      "wednesday",
                                                      "thursday",
                                                      "friday",
                                                    ],
                                                    startTime: "06:00",
                                                    endTime: "22:00",
                                                  },
                                                ],
                                                escortRequired:
                                                  Math.random() > 0.7,
                                                maxOccupancy:
                                                  Math.floor(
                                                    Math.random() * 20
                                                  ) + 1,
                                              },
                                            },
                                            biometric: {
                                              enabled: Math.random() > 0.4,
                                              methods: {
                                                fingerprint: {
                                                  enrolled: Math.random() > 0.3,
                                                  templates:
                                                    Math.floor(
                                                      Math.random() * 10
                                                    ) + 1,
                                                  lastCalibration:
                                                    this.generateRandomDate(30),
                                                },
                                                retinal: {
                                                  enrolled: Math.random() > 0.8,
                                                  lastScan:
                                                    Math.random() > 0.5
                                                      ? this.generateRandomDate(
                                                          7
                                                        )
                                                      : null,
                                                },
                                                facial: {
                                                  enrolled: Math.random() > 0.6,
                                                  accuracy:
                                                    Math.floor(
                                                      Math.random() * 15
                                                    ) + 85,
                                                  lightingConditions:
                                                    this.getRandomChoice([
                                                      "optimal",
                                                      "suboptimal",
                                                      "poor",
                                                    ]),
                                                },
                                              },
                                            },
                                          },
                                        })
                                      ),
                                    })
                                  ),
                                },
                              },
                            },
                          },
                          responsibilities: {
                            primaryRole: this.getRandomChoice([
                              "Technical Lead",
                              "Project Manager",
                              "Security Officer",
                              "Compliance Manager",
                            ]),
                            secondaryRoles: Array.from(
                              { length: Math.floor(Math.random() * 3) },
                              () =>
                                this.getRandomChoice([
                                  "Mentor",
                                  "Reviewer",
                                  "Emergency Contact",
                                  "Deputy",
                                ])
                            ),
                            projects: Array.from(
                              { length: Math.floor(Math.random() * 5) + 1 },
                              (_, projIndex) => ({
                                projectId: `PROJ-${index}-${projIndex}`,
                                name: `Project ${this.getRandomChoice([
                                  "Alpha",
                                  "Beta",
                                  "Gamma",
                                  "Delta",
                                  "Epsilon",
                                ])} ${projIndex + 1}`,
                                role: this.getRandomChoice([
                                  "lead",
                                  "contributor",
                                  "reviewer",
                                  "stakeholder",
                                ]),
                                allocation: Math.floor(Math.random() * 80) + 20,
                                timeline: {
                                  startDate: this.generateRandomDate(180),
                                  endDate: this.generateRandomDate(-30),
                                  milestones: Array.from(
                                    {
                                      length: Math.floor(Math.random() * 5) + 1,
                                    },
                                    (_, mIndex) => ({
                                      milestoneId: `MS-${projIndex}-${mIndex}`,
                                      description: `Milestone ${mIndex + 1}`,
                                      targetDate: this.generateRandomDate(60),
                                      status: this.getRandomChoice([
                                        "completed",
                                        "in_progress",
                                        "pending",
                                        "blocked",
                                      ]),
                                      dependencies:
                                        Math.random() > 0.5
                                          ? [
                                              `MS-${projIndex}-${Math.max(
                                                0,
                                                mIndex - 1
                                              )}`,
                                            ]
                                          : [],
                                      deliverables: Array.from(
                                        {
                                          length:
                                            Math.floor(Math.random() * 3) + 1,
                                        },
                                        (_, delIndex) => ({
                                          deliverableId: `DEL-${projIndex}-${mIndex}-${delIndex}`,
                                          type: this.getRandomChoice([
                                            "document",
                                            "software",
                                            "analysis",
                                            "presentation",
                                          ]),
                                          classification:
                                            this.getRandomChoice(
                                              clearanceLevels
                                            ),
                                          reviewers: Array.from(
                                            {
                                              length:
                                                Math.floor(Math.random() * 3) +
                                                1,
                                            },
                                            () =>
                                              `REV-${this.generateObjectId().slice(
                                                0,
                                                8
                                              )}`
                                          ),
                                        })
                                      ),
                                    })
                                  ),
                                },
                              })
                            ),
                          },
                        },
                      })
                    ),
                  },
                },
              })
            ),
          },
          technology: {
            infrastructure: {
              networks: Array.from(
                { length: Math.floor(Math.random() * 3) + 1 },
                (_, netIndex) => ({
                  networkId: `NET-${index}-${netIndex}`,
                  type: this.getRandomChoice([
                    "production",
                    "staging",
                    "development",
                    "management",
                  ]),
                  configuration: {
                    addressing: {
                      ipv4: {
                        cidr: `${this.generateRandomIP()}/24`,
                        gateway: this.generateRandomIP(),
                        dns: [this.generateRandomIP(), this.generateRandomIP()],
                        dhcp: {
                          enabled: Math.random() > 0.3,
                          range: {
                            start: this.generateRandomIP(),
                            end: this.generateRandomIP(),
                          },
                          leaseTime: Math.floor(Math.random() * 86400) + 3600,
                          reservations: Array.from(
                            { length: Math.floor(Math.random() * 10) },
                            () => ({
                              mac: Array.from({ length: 6 }, () =>
                                Math.floor(Math.random() * 256)
                                  .toString(16)
                                  .padStart(2, "0")
                              )
                                .join(":")
                                .toUpperCase(),
                              ip: this.generateRandomIP(),
                              hostname: `host-${this.generateObjectId().slice(
                                0,
                                8
                              )}`,
                            })
                          ),
                        },
                      },
                      vlan: {
                        id: Math.floor(Math.random() * 4000) + 100,
                        name: `VLAN_${this.getRandomChoice([
                          "PROD",
                          "DEV",
                          "MGMT",
                          "DMZ",
                        ])}_${netIndex}`,
                        isolation: Math.random() > 0.5,
                      },
                    },
                    security: {
                      firewall: {
                        rules: Array.from(
                          { length: Math.floor(Math.random() * 20) + 5 },
                          (_, ruleIndex) => ({
                            ruleId: `FW-${index}-${netIndex}-${ruleIndex}`,
                            priority: ruleIndex + 1,
                            action: this.getRandomChoice([
                              "ALLOW",
                              "DENY",
                              "LOG",
                              "REJECT",
                            ]),
                            direction: this.getRandomChoice([
                              "inbound",
                              "outbound",
                              "bidirectional",
                            ]),
                            source: {
                              addresses: Array.from(
                                { length: Math.floor(Math.random() * 3) + 1 },
                                () => ({
                                  type: this.getRandomChoice([
                                    "host",
                                    "network",
                                    "range",
                                  ]),
                                  value: this.generateRandomIP(),
                                  mask: Math.random() > 0.5 ? "/24" : null,
                                })
                              ),
                              ports: Array.from(
                                { length: Math.floor(Math.random() * 5) + 1 },
                                () => ({
                                  protocol: this.getRandomChoice([
                                    "tcp",
                                    "udp",
                                    "icmp",
                                  ]),
                                  port: Math.floor(Math.random() * 65535) + 1,
                                  service: this.getRandomChoice([
                                    "HTTP",
                                    "HTTPS",
                                    "SSH",
                                    "FTP",
                                    "SMTP",
                                    "DNS",
                                  ]),
                                })
                              ),
                            },
                            destination: {
                              addresses: Array.from(
                                { length: Math.floor(Math.random() * 3) + 1 },
                                () => ({
                                  type: this.getRandomChoice([
                                    "host",
                                    "network",
                                    "range",
                                  ]),
                                  value: this.generateRandomIP(),
                                  mask: Math.random() > 0.5 ? "/24" : null,
                                })
                              ),
                              services: Array.from(
                                { length: Math.floor(Math.random() * 3) + 1 },
                                () => ({
                                  name: this.getRandomChoice([
                                    "web",
                                    "database",
                                    "email",
                                    "file-share",
                                  ]),
                                  port: Math.floor(Math.random() * 65535) + 1,
                                  protocol: this.getRandomChoice([
                                    "tcp",
                                    "udp",
                                  ]),
                                })
                              ),
                            },
                            conditions: {
                              timeRestrictions:
                                Math.random() > 0.7
                                  ? {
                                      schedule: this.getRandomChoice([
                                        "business_hours",
                                        "24x7",
                                        "maintenance_window",
                                      ]),
                                      timezone: "UTC",
                                    }
                                  : null,
                              userGroups:
                                Math.random() > 0.6
                                  ? Array.from(
                                      {
                                        length:
                                          Math.floor(Math.random() * 3) + 1,
                                      },
                                      () =>
                                        `GROUP-${this.generateObjectId().slice(
                                          0,
                                          8
                                        )}`
                                    )
                                  : [],
                            },
                          })
                        ),
                      },
                      monitoring: {
                        ids: {
                          enabled: Math.random() > 0.2,
                          signatures: Array.from(
                            { length: Math.floor(Math.random() * 100) + 50 },
                            (_, sigIndex) => ({
                              signatureId: `SIG-${sigIndex}`,
                              name: `Signature ${sigIndex + 1}`,
                              severity: this.getRandomChoice([
                                "low",
                                "medium",
                                "high",
                                "critical",
                              ]),
                              category: this.getRandomChoice([
                                "malware",
                                "intrusion",
                                "policy_violation",
                                "reconnaissance",
                              ]),
                              lastTriggered:
                                Math.random() > 0.3
                                  ? this.generateRandomDate(30)
                                  : null,
                              falsePositiveRate: Math.random() * 0.1,
                            })
                          ),
                        },
                      },
                    },
                  },
                })
              ),
            },
          },
          compliance: {
            frameworks: frameworkTypes.map((framework) => ({
              frameworkId: `FW-${framework}-${index}`,
              name: framework,
              version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(
                Math.random() * 5
              )}`,
              implementation: {
                status: this.getRandomChoice([
                  "in_progress",
                  "implemented",
                  "planned",
                  "not_applicable",
                ]),
                completionPercentage: Math.floor(Math.random() * 101),
                lastAssessment: this.generateRandomDate(90),
                nextAssessment: this.generateRandomDate(-90),
                controls: Array.from(
                  { length: Math.floor(Math.random() * 50) + 10 },
                  (_, ctrlIndex) => ({
                    controlId: `${framework}-${(ctrlIndex + 1)
                      .toString()
                      .padStart(3, "0")}`,
                    title: `Control ${ctrlIndex + 1}`,
                    description: `This control addresses ${this.getRandomChoice(
                      ["access", "audit", "risk", "change"]
                    )} management requirements.`,
                    status: this.getRandomChoice([
                      "compliant",
                      "non_compliant",
                      "partially_compliant",
                      "not_tested",
                    ]),
                    implementation: {
                      responsible: `ROLE-${this.generateObjectId().slice(
                        0,
                        8
                      )}`,
                      implementationDate: this.generateRandomDate(365),
                      testingFrequency: this.getRandomChoice([
                        "monthly",
                        "quarterly",
                        "annually",
                        "continuous",
                      ]),
                      lastTested: this.generateRandomDate(30),
                      evidence: {
                        documents: Array.from(
                          { length: Math.floor(Math.random() * 5) + 1 },
                          (_, docIndex) => ({
                            documentId: `DOC-${ctrlIndex}-${docIndex}`,
                            title: `Evidence Document ${docIndex + 1}`,
                            type: this.getRandomChoice([
                              "policy",
                              "procedure",
                              "test_result",
                              "screenshot",
                              "log",
                            ]),
                            classification:
                              this.getRandomChoice(clearanceLevels),
                            location: `https://documents.example.com/${this.generateObjectId()}`,
                            metadata: {
                              created: this.generateRandomDate(180),
                              lastModified: this.generateRandomDate(30),
                              version: `${
                                Math.floor(Math.random() * 10) + 1
                              }.${Math.floor(Math.random() * 10)}`,
                              approvals: Array.from(
                                { length: Math.floor(Math.random() * 3) + 1 },
                                (_, appIndex) => ({
                                  approver: `USER-${this.generateObjectId().slice(
                                    0,
                                    8
                                  )}`,
                                  role: this.getRandomChoice([
                                    "manager",
                                    "security_officer",
                                    "compliance_officer",
                                    "legal",
                                  ]),
                                  date: this.generateRandomDate(60),
                                  status: this.getRandomChoice([
                                    "approved",
                                    "pending",
                                    "rejected",
                                  ]),
                                  comments:
                                    Math.random() > 0.7
                                      ? `Review comment ${appIndex + 1}`
                                      : null,
                                })
                              ),
                            },
                          })
                        ),
                        automation: {
                          toolName: this.getRandomChoice([
                            "Nessus",
                            "Qualys",
                            "Rapid7",
                            "Tenable",
                            "Custom",
                          ]),
                          scanFrequency: this.getRandomChoice([
                            "daily",
                            "weekly",
                            "monthly",
                          ]),
                          lastScan: this.generateRandomDate(7),
                          findings: Array.from(
                            { length: Math.floor(Math.random() * 20) },
                            (_, findIndex) => ({
                              findingId: `FIND-${ctrlIndex}-${findIndex}`,
                              severity: this.getRandomChoice([
                                "low",
                                "medium",
                                "high",
                                "critical",
                              ]),
                              status: this.getRandomChoice([
                                "open",
                                "closed",
                                "mitigated",
                                "accepted",
                              ]),
                              description: `Automated finding ${findIndex + 1}`,
                              remediation: `Remediation step ${findIndex + 1}`,
                              dueDate: this.generateRandomDate(-30),
                            })
                          ),
                        },
                      },
                    },
                  })
                ),
              },
            })),
          },
        },
      ],
    };
  }

  private generateVulnerabilityAssessmentRecord(index: number): any {
    const vulnTypes = [
      "SQL Injection",
      "XSS",
      "CSRF",
      "Buffer Overflow",
      "Authentication Bypass",
    ];
    const severities = ["low", "medium", "high", "critical"];
    const statuses = [
      "new",
      "confirmed",
      "false_positive",
      "fixed",
      "accepted",
    ];

    return {
      _id: this.generateObjectId(),
      assessmentId: `ASSESS-${index.toString().padStart(6, "0")}`,
      guid: this.generateUUID(),
      metadata: {
        scanDate: this.generateRandomDate(30),
        scanDuration: Math.floor(Math.random() * 7200) + 300,
        scanType: this.getRandomChoice([
          "authenticated",
          "unauthenticated",
          "hybrid",
        ]),
        tool: this.getRandomChoice([
          "Burp Suite",
          "OWASP ZAP",
          "Nessus",
          "Qualys",
          "Custom",
        ]),
        version: `${Math.floor(Math.random() * 10) + 1}.${Math.floor(
          Math.random() * 10
        )}.${Math.floor(Math.random() * 10)}`,
      },
      target: {
        host: {
          ip: this.generateRandomIP(),
          hostname: `host-${index}.example.com`,
          ports: Array.from(
            { length: Math.floor(Math.random() * 10) + 1 },
            () => ({
              port: Math.floor(Math.random() * 65535) + 1,
              protocol: this.getRandomChoice(["tcp", "udp"]),
              service: this.getRandomChoice([
                "http",
                "https",
                "ssh",
                "ftp",
                "smtp",
                "dns",
              ]),
              version: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(
                Math.random() * 10
              )}`,
            })
          ),
        },
        application: {
          name: `Application ${index}`,
          version: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(
            Math.random() * 10
          )}.${Math.floor(Math.random() * 10)}`,
          framework: this.getRandomChoice([
            "Spring",
            "Django",
            "Express",
            "Laravel",
            "ASP.NET",
          ]),
          language: this.getRandomChoice([
            "Java",
            "Python",
            "JavaScript",
            "PHP",
            "C#",
          ]),
        },
      },
      vulnerabilities: Array.from(
        { length: Math.floor(Math.random() * 50) + 10 },
        (_, vulnIndex) => ({
          vulnerabilityId: `VULN-${index}-${vulnIndex}`,
          cveId:
            Math.random() > 0.7
              ? `CVE-${new Date().getFullYear()}-${Math.floor(
                  Math.random() * 10000
                )
                  .toString()
                  .padStart(4, "0")}`
              : null,
          type: this.getRandomChoice(vulnTypes),
          severity: this.getRandomChoice(severities),
          status: this.getRandomChoice(statuses),
          details: {
            description: `${this.getRandomChoice(
              vulnTypes
            )} vulnerability found in parameter`,
            location: {
              url: `https://host-${index}.example.com${this.getRandomChoice([
                "/api",
                "/login",
                "/search",
                "/admin",
              ])}`,
              parameter: this.getRandomChoice([
                "id",
                "username",
                "search",
                "file",
                "redirect",
              ]),
              method: this.getRandomChoice(["GET", "POST", "PUT", "DELETE"]),
              evidence: {
                request: {
                  headers: {
                    "User-Agent": "Security Scanner",
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "text/html,application/xhtml+xml",
                  },
                  body:
                    Math.random() > 0.5
                      ? `param1=value1&param2=value2&${this.getRandomChoice([
                          "id",
                          "search",
                        ])}=malicious_payload`
                      : null,
                },
                response: {
                  statusCode: this.getRandomChoice([200, 302, 403, 500]),
                  headers: {
                    "Content-Type": "text/html",
                    Server: this.getRandomChoice(["Apache", "Nginx", "IIS"]),
                  },
                  body: "Response indicating vulnerability...",
                  responseTime: Math.floor(Math.random() * 5000) + 100,
                },
              },
            },
            impact: {
              confidentiality: this.getRandomChoice([
                "none",
                "partial",
                "complete",
              ]),
              integrity: this.getRandomChoice(["none", "partial", "complete"]),
              availability: this.getRandomChoice([
                "none",
                "partial",
                "complete",
              ]),
              cvssScore: Math.round(Math.random() * 10 * 10) / 10,
              businessImpact: this.getRandomChoice(["low", "medium", "high"]),
              technicalImpact: this.getRandomChoice(["low", "medium", "high"]),
            },
            remediation: {
              recommendation: `Fix ${this.getRandomChoice(
                vulnTypes
              )} by implementing proper input validation`,
              effort: this.getRandomChoice(["low", "medium", "high"]),
              priority: this.getRandomChoice([
                "low",
                "medium",
                "high",
                "critical",
              ]),
              timeline: Math.floor(Math.random() * 90) + 7,
              resources: Array.from(
                { length: Math.floor(Math.random() * 3) + 1 },
                () =>
                  this.getRandomChoice([
                    "developer",
                    "security_engineer",
                    "system_admin",
                    "devops",
                  ])
              ),
            },
          },
          discovery: {
            discoveredBy: this.getRandomChoice([
              "automated_scan",
              "manual_testing",
              "code_review",
              "penetration_test",
            ]),
            discoveryDate: this.generateRandomDate(30),
            confirmedDate:
              Math.random() > 0.3 ? this.generateRandomDate(25) : null,
            tester: `TESTER-${this.generateObjectId().slice(0, 8)}`,
            testingMethod: this.getRandomChoice([
              "blackbox",
              "whitebox",
              "greybox",
            ]),
          },
        })
      ),
    };
  }

  private generateComplianceFrameworkRecord(index: number): any {
    const frameworks = [
      "SOC2",
      "ISO27001",
      "NIST",
      "FEDRAMP",
      "CMMC",
      "PCI DSS",
    ];
    const controlFamilies = [
      "Access Control",
      "Audit",
      "Risk Assessment",
      "System Protection",
      "Incident Response",
    ];

    return {
      _id: this.generateObjectId(),
      frameworkId: `FRAMEWORK-${index.toString().padStart(4, "0")}`,
      guid: this.generateUUID(),
      framework: {
        name: this.getRandomChoice(frameworks),
        version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(
          Math.random() * 5
        )}`,
        effectiveDate: this.generateRandomDate(1095),
        organization: `Organization ${index}`,
        scope: {
          systems: Array.from(
            { length: Math.floor(Math.random() * 10) + 5 },
            (_, sysIndex) => ({
              systemId: `SYS-${index}-${sysIndex}`,
              name: `System ${sysIndex + 1}`,
              classification: this.getRandomChoice([
                "public",
                "internal",
                "confidential",
                "restricted",
              ]),
              dataTypes: Array.from(
                { length: Math.floor(Math.random() * 5) + 1 },
                () =>
                  this.getRandomChoice([
                    "pii",
                    "phi",
                    "financial",
                    "intellectual_property",
                    "operational",
                  ])
              ),
            })
          ),
          processes: Array.from(
            { length: Math.floor(Math.random() * 8) + 3 },
            (_, procIndex) => ({
              processId: `PROC-${index}-${procIndex}`,
              name: `Process ${procIndex + 1}`,
              owner: `OWNER-${this.generateObjectId().slice(0, 8)}`,
              criticality: this.getRandomChoice([
                "low",
                "medium",
                "high",
                "critical",
              ]),
            })
          ),
        },
        assessment: {
          assessmentId: `ASSESS-FRAMEWORK-${index}`,
          period: {
            start: this.generateRandomDate(365),
            end: this.generateRandomDate(30),
          },
          assessor: {
            organization: this.getRandomChoice([
              "Internal",
              "Big Four Firm",
              "Specialized Auditor",
            ]),
            leadAuditor: `AUDITOR-${this.generateObjectId().slice(0, 8)}`,
            team: Array.from(
              { length: Math.floor(Math.random() * 5) + 2 },
              (_, memberIndex) => ({
                auditorId: `AUD-${index}-${memberIndex}`,
                role: this.getRandomChoice([
                  "lead",
                  "senior",
                  "staff",
                  "specialist",
                ]),
                specialization: this.getRandomChoice([
                  "technical",
                  "process",
                  "documentation",
                  "interview",
                ]),
              })
            ),
          },
          methodology: {
            approach: this.getRandomChoice([
              "risk_based",
              "comprehensive",
              "targeted",
            ]),
            samplingMethod: this.getRandomChoice([
              "statistical",
              "judgmental",
              "hybrid",
            ]),
            testingProcedures: Array.from(
              { length: Math.floor(Math.random() * 10) + 5 },
              (_, testIndex) => ({
                procedureId: `TEST-PROC-${testIndex}`,
                name: `Testing Procedure ${testIndex + 1}`,
                type: this.getRandomChoice([
                  "inquiry",
                  "observation",
                  "inspection",
                  "reperformance",
                ]),
                scope: this.getRandomChoice([
                  "population",
                  "sample",
                  "walkthrough",
                ]),
              })
            ),
          },
        },
        controlFamilies: controlFamilies.map((family, familyIndex) => ({
          familyId: `CF-${familyIndex + 1}`,
          name: family,
          description: `Controls related to ${family.toLowerCase()}`,
          controls: Array.from(
            { length: Math.floor(Math.random() * 15) + 5 },
            (_, ctrlIndex) => ({
              controlId: `${familyIndex + 1}.${ctrlIndex + 1}`,
              title: `${family} Control ${ctrlIndex + 1}`,
              objective: `Ensure proper ${family.toLowerCase()} implementation`,
              riskLevel: this.getRandomChoice(["low", "medium", "high"]),
              controlType: this.getRandomChoice([
                "preventive",
                "detective",
                "corrective",
              ]),
              frequency: this.getRandomChoice([
                "continuous",
                "daily",
                "weekly",
                "monthly",
                "quarterly",
                "annually",
              ]),
              implementation: {
                status: this.getRandomChoice([
                  "designed",
                  "implemented",
                  "operating_effectively",
                  "deficient",
                ]),
                designEffectiveness: this.getRandomChoice([
                  "effective",
                  "ineffective",
                  "not_evaluated",
                ]),
                operatingEffectiveness: this.getRandomChoice([
                  "effective",
                  "ineffective",
                  "not_evaluated",
                ]),
                owner: `OWNER-${this.generateObjectId().slice(0, 8)}`,
                evidence: {
                  policies: Array.from(
                    { length: Math.floor(Math.random() * 3) + 1 },
                    (_, polIndex) => ({
                      policyId: `POL-${familyIndex}-${ctrlIndex}-${polIndex}`,
                      name: `Policy ${polIndex + 1}`,
                      version: `${
                        Math.floor(Math.random() * 5) + 1
                      }.${Math.floor(Math.random() * 10)}`,
                      approvalDate: this.generateRandomDate(365),
                      reviewDate: this.generateRandomDate(90),
                    })
                  ),
                  procedures: Array.from(
                    { length: Math.floor(Math.random() * 5) + 1 },
                    (_, procIndex) => ({
                      procedureId: `PROC-${familyIndex}-${ctrlIndex}-${procIndex}`,
                      name: `Procedure ${procIndex + 1}`,
                      lastUpdated: this.generateRandomDate(180),
                      testResults: Array.from(
                        { length: Math.floor(Math.random() * 4) + 1 },
                        (_, testIndex) => ({
                          testDate: this.generateRandomDate(90),
                          result: this.getRandomChoice([
                            "pass",
                            "fail",
                            "not_applicable",
                          ]),
                          tester: `TESTER-${this.generateObjectId().slice(
                            0,
                            8
                          )}`,
                          findings:
                            Math.random() > 0.7
                              ? Array.from(
                                  { length: Math.floor(Math.random() * 3) + 1 },
                                  (_, findIndex) => ({
                                    findingId: `FIND-${familyIndex}-${ctrlIndex}-${findIndex}`,
                                    severity: this.getRandomChoice([
                                      "low",
                                      "medium",
                                      "high",
                                    ]),
                                    description: `Finding ${findIndex + 1}`,
                                    recommendation: `Recommendation ${
                                      findIndex + 1
                                    }`,
                                    status: this.getRandomChoice([
                                      "open",
                                      "closed",
                                      "in_progress",
                                    ]),
                                  })
                                )
                              : [],
                        })
                      ),
                    })
                  ),
                  artifacts: Array.from(
                    { length: Math.floor(Math.random() * 5) + 1 },
                    (_, artIndex) => ({
                      artifactId: `ART-${familyIndex}-${ctrlIndex}-${artIndex}`,
                      type: this.getRandomChoice([
                        "screenshot",
                        "log",
                        "report",
                        "configuration",
                        "documentation",
                      ]),
                      description: `Artifact ${artIndex + 1}`,
                      location: `https://evidence.example.com/${this.generateObjectId()}`,
                      collectionDate: this.generateRandomDate(30),
                      retention: Math.floor(Math.random() * 2555) + 365,
                    })
                  ),
                },
              },
            })
          ),
        })),
      },
    };
  }

  private generateNestedScanRecord(index: number): any {
    return {
      _id: this.generateObjectId(),
      scanId: `SCAN-${index.toString().padStart(6, "0")}`,
      guid: this.generateUUID(),
      nested: {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  deepData: `Deep nested value ${index}`,
                  configurations: Array.from(
                    { length: Math.floor(Math.random() * 5) + 1 },
                    (_, configIndex) => ({
                      configId: `CONFIG-${index}-${configIndex}`,
                      nested: {
                        settings: {
                          advanced: {
                            security: {
                              encryption: {
                                algorithm: this.getRandomChoice([
                                  "AES256",
                                  "RSA2048",
                                  "ECDSA",
                                ]),
                                keyRotation: {
                                  frequency: this.getRandomChoice([
                                    "daily",
                                    "weekly",
                                    "monthly",
                                  ]),
                                  lastRotation: this.generateRandomDate(30),
                                  nextRotation: this.generateRandomDate(-30),
                                },
                              },
                            },
                          },
                        },
                      },
                    })
                  ),
                },
              },
            },
          },
        },
      },
      scans: Array.from(
        { length: Math.floor(Math.random() * 3) + 1 },
        (_, scanIndex) => ({
          scanIndex,
          results: Array.from(
            { length: Math.floor(Math.random() * 10) + 5 },
            (_, resultIndex) => ({
              resultId: `RESULT-${index}-${scanIndex}-${resultIndex}`,
              data: {
                nested: {
                  findings: {
                    vulnerabilities: Array.from(
                      { length: Math.floor(Math.random() * 5) + 1 },
                      (_, vulnIndex) => ({
                        vulnerabilityId: `VULN-${index}-${scanIndex}-${resultIndex}-${vulnIndex}`,
                        details: {
                          technical: {
                            analysis: {
                              root: {
                                cause: {
                                  investigation: {
                                    findings: `Root cause analysis for vulnerability ${vulnIndex}`,
                                    methodology: this.getRandomChoice([
                                      "static",
                                      "dynamic",
                                      "interactive",
                                    ]),
                                    confidence:
                                      Math.floor(Math.random() * 40) + 60,
                                  },
                                },
                              },
                            },
                          },
                        },
                      })
                    ),
                  },
                },
              },
            })
          ),
        })
      ),
    };
  }

  private generateSimpleSeverityRecord(index: number): any {
    const severities = ["critical", "high", "moderate", "low"];
    const adjectives = ["Security", "Network", "Application", "Database", "System", "Infrastructure", "API", "Authentication", "Authorization", "Encryption"];
    const nouns = ["Alert", "Issue", "Finding", "Incident", "Event", "Anomaly", "Violation", "Breach", "Vulnerability", "Risk"];
    
    return {
      id: this.generateUUID(),
      name: `${this.getRandomChoice(adjectives)} ${this.getRandomChoice(nouns)} ${index.toString().padStart(6, "0")}`,
      severity: this.getRandomChoice(severities)
    };
  }

  async generate(config: JSONGeneratorConfig): Promise<void> {
    const filePath = path.join(process.cwd(), 'generated', config.filename);
    const writeStream = createWriteStream(filePath, { 
      encoding: 'utf8',
      highWaterMark: 1024 * 1024 // 1MB buffer
    });
    
    let totalBytes = 0;
    
    // Helper function to write with backpressure handling
    const writeWithBackpressure = (chunk: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const canContinue = writeStream.write(chunk);
        totalBytes += chunk.length;
        
        if (canContinue) {
          resolve();
        } else {
          // Wait for drain event before continuing
          writeStream.once('drain', resolve);
        }
        
        writeStream.once('error', reject);
      });
    };
    
    try {
      // Write opening bracket
      await writeWithBackpressure('[\n');

      // Determine which generator function to use
      let generateRecord: (index: number) => any;
      switch (config.format) {
        case "organization":
          generateRecord = (i) => this.generateOrganizationRecord(i);
          break;
        case "vulnerability-assessment":
          generateRecord = (i) => this.generateVulnerabilityAssessmentRecord(i);
          break;
        case "compliance-framework":
          generateRecord = (i) => this.generateComplianceFrameworkRecord(i);
          break;
        case "nested-scan":
          generateRecord = (i) => this.generateNestedScanRecord(i);
          break;
        case "simple-severity":
          generateRecord = (i) => this.generateSimpleSeverityRecord(i);
          break;
        default:
          generateRecord = (i) => this.generateOrganizationRecord(i);
          break;
      }

      // Generate and write records one at a time
      for (let i = 0; i < config.totalRecords; i++) {
        const record = generateRecord(i);
        const recordJson = JSON.stringify(record, null, 2);
        
        // Indent the record by 2 spaces
        const indentedRecord = recordJson
          .split('\n')
          .map(line => '  ' + line)
          .join('\n');
        
        await writeWithBackpressure(indentedRecord);
        
        // Add comma if not the last record
        if (i < config.totalRecords - 1) {
          await writeWithBackpressure(',\n');
        } else {
          await writeWithBackpressure('\n');
        }
        
        // Log progress every 100 records
        if ((i + 1) % 100 === 0) {
          console.info(`Progress: ${i + 1}/${config.totalRecords} records written...`);
        }
      }

      // Write closing bracket
      await writeWithBackpressure(']');
      
      // Close the stream and wait for finish
      await new Promise<void>((resolve, reject) => {
        writeStream.end();
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      console.info(`JSON file generated: ${filePath}`);
      console.info(`Format: ${config.format}`);
      console.info(`Records: ${config.totalRecords}`);
      console.info(`File size: ${Math.round(totalBytes / 1024)} KB`);
      
    } catch (error) {
      console.error(`Error writing file: ${error instanceof Error ? error.message : String(error)}`);
      writeStream.destroy();
      process.exit(1);
    }
  }
}

function createOrganizationConfig(): JSONGeneratorConfig {
  return {
    filename: "test-organization-data.json",
    totalRecords: 5,
    format: "organization",
  };
}

function createVulnerabilityConfig(): JSONGeneratorConfig {
  return {
    filename: "test-vulnerability-assessment.json",
    totalRecords: 10,
    format: "vulnerability-assessment",
  };
}

function createComplianceConfig(): JSONGeneratorConfig {
  return {
    filename: "test-compliance-framework.json",
    totalRecords: 3,
    format: "compliance-framework",
  };
}

function createNestedScanConfig(): JSONGeneratorConfig {
  return {
    filename: "test-nested-scan.json",
    totalRecords: 8,
    format: "nested-scan",
  };
}

function createLargeOrganizationConfig(): JSONGeneratorConfig {
  return {
    filename: "large-organization-data.json",
    totalRecords: 70,
    format: "organization",
  };
}

function createLargeVulnerabilityConfig(): JSONGeneratorConfig {
  return {
    filename: "large-vulnerability-assessment.json",
    totalRecords: 1300,
    format: "vulnerability-assessment",
  };
}

function createLargeComplianceConfig(): JSONGeneratorConfig {
  return {
    filename: "large-compliance-framework.json",
    totalRecords: 800,
    format: "compliance-framework",
  };
}

function createLargeNestedScanConfig(): JSONGeneratorConfig {
  return {
    filename: "large-nested-scan.json",
    totalRecords: 300,
    format: "nested-scan",
  };
}

function createSimpleSeverityConfig(): JSONGeneratorConfig {
  return {
    filename: "simple.json",
    totalRecords: 100_000,
    format: "simple-severity",
  };
}

async function main() {
  const generator = new JSONGenerator();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.info("JSON Deep Nested Data Generator");
    console.info("");
    console.info(
      "Generates deeply nested JSON test files for assessments and testing"
    );
    console.info("");
    console.info("Usage:");
    console.info("  npx tsx app/json-generator.ts [format]");
    console.info("");
    console.info("Available formats:");
    console.info(
      "  organization          - Enterprise organization hierarchy (5 records)"
    );
    console.info(
      "  vulnerability-assessment - Security vulnerability data (10 records)"
    );
    console.info(
      "  compliance-framework  - Compliance framework structure (3 records)"
    );
    console.info(
      "  nested-scan          - Multi-level nested scan results (8 records)"
    );
    console.info(
      "  simple-severity      - Flat records with id, name, severity (20,000 records)"
    );
    console.info("  all                  - Generate all formats");
    console.info("");
    console.info("Large formats:");
    console.info(
      "  organization-large          - Large organization data (700 records)"
    );
    console.info(
      "  vulnerability-assessment-large - Large vulnerability data (1,300 records)"
    );
    console.info(
      "  compliance-framework-large  - Large compliance data (8,000 records)"
    );
    console.info(
      "  nested-scan-large          - Large nested scan data (300 records)"
    );
    console.info("");
    console.info("Examples:");
    console.info("  npx tsx src/json-generator.ts organization");
    console.info("  npx tsx src/json-generator.ts simple-severity");
    console.info("  npx tsx src/json-generator.ts all");
    console.info("");
    return;
  }

  const format = args[0].toLowerCase();

  switch (format) {
    case "organization":
      await generator.generate(createOrganizationConfig());
      break;
    case "vulnerability-assessment":
      await generator.generate(createVulnerabilityConfig());
      break;
    case "compliance-framework":
      await generator.generate(createComplianceConfig());
      break;
    case "nested-scan":
      await generator.generate(createNestedScanConfig());
      break;
    case "simple-severity":
      await generator.generate(createSimpleSeverityConfig());
      break;
    case "organization-large":
      await generator.generate(createLargeOrganizationConfig());
      break;
    case "vulnerability-assessment-large":
      await generator.generate(createLargeVulnerabilityConfig());
      break;
    case "compliance-framework-large":
      await generator.generate(createLargeComplianceConfig());
      break;
    case "nested-scan-large":
      await generator.generate(createLargeNestedScanConfig());
      break;
    case "all":
      await generator.generate(createOrganizationConfig());
      await generator.generate(createVulnerabilityConfig());
      await generator.generate(createComplianceConfig());
      await generator.generate(createNestedScanConfig());
      break;
    default:
      console.error(`Unknown format: ${format}`);
      console.info(
        "Available formats: organization, vulnerability-assessment, compliance-framework, nested-scan, simple-severity, organization-large, vulnerability-assessment-large, compliance-framework-large, nested-scan-large, all"
      );
      process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { JSONGenerator, type JSONGeneratorConfig };

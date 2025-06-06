/**
 * @file config.js
 * @description Stores shared configurations for the RFP and FOIA analyzers.
 */

// --- RFP Configuration ---
export const RFP_PROMPT_CONFIG = {
    summary: {
        defaultText: "You will be provided with the content of the RFP. Follow these guidelines to create a summary: Focus on extracting and condensing key information from the RFP. Ensure the summary captures all essential aspects, including: Project objectives, Scope of work, Requirements and specifications, Evaluation criteria,  Submission guidelines, Deadlines. Maintain a balance between conciseness and comprehensiveness. The summary should be no more 2 pages in length.",
        delimiterKey: "SUMMARY",
        databaseKey: "rfpSummary",
        title: "RFP Summary"
    },
    questions: { 
        defaultText: "Generate a list of 20 critical and insightful clarification questions to ask regarding an RFP. These questions should be designed to uncover hidden requirements, ambiguous statements, or areas where more detail is needed to create a comprehensive and competitive proposal. The goal is to ensure a thorough understanding of the client's needs and expectations.",
        delimiterKey: "QUESTIONS",
        databaseKey: "generatedQuestions",
        title: "Generated Clarification Questions"
    },
    deadlines: {
        defaultText: "You are an expert in analyzing Request for Proposal (RFP) documents. Your task is to identify key deadlines and the submission format for the RFP. Follow these steps to extract the required information: 1. Carefully read the entire RFP document. 2. Identify all key deadlines, including dates and times for each deadline. 3. Identify the required submission format for the RFP (e.g., electronic submission, hard copy submission, online portal submission). 4. Output the information in a well-organized list with clear labels for each deadline and the submission format.",
        delimiterKey: "DEADLINES", 
        databaseKey: "rfpDeadlines",
        title: "Key Deadlines"
    },
    submissionFormat: { 
        defaultText: "Carefully review the RFP document to identify the specified submission format for the proposal (e.g., mail, email, online portal, usb, fax). Identify all people related to the RFP. 3. Extract all relevant contact information, including: Addresses for mail submissions. Email addresses for electronic submissions. Links to online portals or websites for online submissions. Phone numbers for contact persons. Names and titles of contact persons. 4. Present the extracted information in a clear and organized manner.",
        delimiterKey: "SUBMISSION_FORMAT", 
        databaseKey: "rfpSubmissionFormat",
        title: "Submission Format"
    },
    requirements: { 
        defaultText: "5. A list of Requirements (e.g., mandatory, highly desirable).", 
        delimiterKey: "REQUIREMENTS",
        databaseKey: "rfpKeyRequirements",
        title: "Requirements"
    },
    stakeholders: { 
        defaultText: "6. Mentioned Stakeholders or Key Contacts.", 
        delimiterKey: "STAKEHOLDERS",
        databaseKey: "rfpStakeholders",
        title: "Mentioned Stakeholders"
    },
    risks: { 
        defaultText: "7. Potential Risks or Red Flags identified in the RFP.", 
        delimiterKey: "RISKS",
        databaseKey: "rfpRisks",
        title: "Potential Risks/Red Flags" 
    },
    registration: { 
        defaultText: "8. Registration requirements or details for bidders.", 
        delimiterKey: "REGISTRATION",
        databaseKey: "rfpRegistration",
        title: "Registration Details"
    },
    licenses: { 
        defaultText: "9. Required Licenses or Certifications for bidders.", 
        delimiterKey: "LICENSES",
        databaseKey: "rfpLicenses",
        title: "Licenses & Certifications"
    },
    budget: { 
        defaultText: "10. Any mentioned Budget constraints or financial information.", 
        delimiterKey: "BUDGET",
        databaseKey: "rfpBudget",
        title: "Budget Information"
    }
};

// --- FOIA Configuration ---
export const FOIA_DOCUMENT_TYPE_CATEGORIES = [
    "IT Support",
    "IT Managed Services",
    "ERP Managed Services",
    "Cloud Migration",
    "IT Staffing",
    "Undetermined" 
];

export const FOIA_PROMPT_CONFIG = {
    summary: {
        defaultText: "Provide a concise overview of the FOIA document content, highlighting the main subject, key information disclosed or requested, and any immediate takeaways.",
        delimiterKey: "SUMMARY",
        databaseKey: "foiaSummary",
        title: "Summary"
    },
    proposalComparison: { 
        defaultText: "If the FOIA response includes multiple documents or distinct sections, compare them. Assess the relevance and completeness of the information provided in relation to the presumed request or subject matter. Assign a qualitative rating (e.g., High, Medium, Low relevance/completeness) if applicable.",
        delimiterKey: "PROPOSAL_COMPARISON_RATING",
        databaseKey: "foiaProposalComparison",
        title: "Proposal Comparison and Rating"
    },
    insightsAnalysis: { 
        defaultText: "Extract key insights, patterns, or significant findings from the FOIA documents. Analyze the implications of the disclosed information.",
        delimiterKey: "INSIGHTS_ANALYSIS",
        databaseKey: "foiaInsightsAnalysis",
        title: "Insights and Analysis"
    },
    pricingIntelligence: { 
        defaultText: "Identify any information related to fees (e.g., search, duplication, review costs), fee waivers, or any other financial data or budgetary implications mentioned in the FOIA documents.",
        delimiterKey: "FINANCIAL_INTELLIGENCE",
        databaseKey: "foiaPricingIntelligence",
        title: "Pricing Fees Intelligence"
    },
    marketTrends: { 
        defaultText: "Analyze the disclosed information in the context of public interest, current events, or any related trends. What is the broader significance or potential impact of this information?",
        delimiterKey: "CONTEXT_IMPACT",
        databaseKey: "foiaMarketTrends",
        title: "Market Trends"
    },
    tasksWorkPlan: { 
        defaultText: "Based on the information disclosed, outline any potential next steps, follow-up actions, or tasks that might be necessary for the user (e.g., further investigation, data analysis, public dissemination).",
        delimiterKey: "ACTIONABLE_ITEMS",
        databaseKey: "foiaTasksWorkPlan",
        title: "Tasks or Work Plan"
    },
    documentType: { 
        defaultText: `Based on the content of the provided FOIA document(s), determine and state the primary type of the document(s). Your answer MUST be one of the following predefined categories: ${FOIA_DOCUMENT_TYPE_CATEGORIES.join(", ")}. If the type cannot be confidently determined from the provided list, classify it as "Undetermined".`,
        delimiterKey: "DOCUMENT_TYPE",
        databaseKey: "foiaType", 
        title: "Document Type (AI Determined)"
    }
};

// --- Shared Constants ---
export const PROMPT_MAIN_INSTRUCTION = "Please analyze the following {DOCUMENT_TYPE} text.\nProvide the following distinct sections in your response, each clearly delimited:";
export const PROMPT_SECTION_DELIMITER_FORMAT = "\n\n###{SECTION_KEY_UPPER}_START###\n[Content for {SECTION_KEY_UPPER}]\n###{SECTION_KEY_UPPER}_END###";
export const PROMPT_TEXT_SUFFIX = "\n\n{DOCUMENT_TYPE} Text (including any addendums):\n---\n{TEXT_PLACEHOLDER}\n---";


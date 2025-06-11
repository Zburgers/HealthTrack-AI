🧬 schema.md — MongoDB Atlas Schemas for HealthTrack MVP
📁 Database: healthtrack
🧍‍♂️ Collection: patients
📌 Purpose:
Stores full patient context, including vitals, AI outputs, case state, and matched history.

🧾 Schema:
jsonc
Copy
Edit
{
  "_id": "uuid",
  "name": "string",
  "age": "number",
  "sex": "M" | "F" | "O",
  "createdAt": "ISODate",
  "last_updated": "ISODate",

  "vitals": {
    "temp": "number",
    "bp": "string",
    "hr": "number",
    "spo2": "number",
    "rr": "number"
  },

  "symptoms": ["string"],
  "observations": "string",

  "icd_tags": [
    {
      "code": "string",
      "label": "string",
      "confidence": "float",
      "source_phrase": "string"
    }
  ],

  // ✅ New — For simplified lookup of codes
  "icd_tag_summary": ["string"], // e.g. ["I10", "E11.9", "R07.4"]

  "risk_predictions": [
    {
      "condition": "string",
      "confidence": "float",
      "explanation": ["string"]
    }
  ],

  // ✅ New — For quick display of patient risk
  "risk_score": "float", // 0.75 for 75%

  "soap_note": {
    "subjective": "string",
    "objective": "string",
    "assessment": "string",
    "plan": "string"
  },

  "matched_cases": [
    {
      "case_id": "string",
      "similarity_score": "float",
      "diagnosis": "string",
      "summary": "string"
    }
  ],

  "ai_metadata": {
    "last_model_used": "string",
    "last_prompt_type": "string",
    "completed_agents": ["string"],
    "execution_time_ms": "number"
  },

  "status": "string", // "draft" | "analyzing" | "complete" | "exported"
  "owner_uid": "string"
}

🧪 Example Document:
json
Copy
Edit
{
  "_id": "uuid",
  "name": "John Doe",
  "age": 52,
  "sex": "M",
  "createdAt": "2025-06-10T10:00:00Z",
  "last_updated": "2025-06-11T12:00:00Z",
  "vitals": {
    "temp": 98.6,
    "bp": "130/80",
    "hr": 80,
    "spo2": 97,
    "rr": 18
  },
  "symptoms": ["fatigue", "frequent urination"],
  "observations": "Patient appears fatigued, mild dehydration observed.",
  "icd_tags": [
    {
      "code": "E11",
      "label": "Type 2 diabetes mellitus",
      "confidence": 0.91,
      "source_phrase": "frequent urination"
    }
  ],
  "risk_predictions": [
    {
      "condition": "Diabetes",
      "confidence": 0.82,
      "explanation": [
        "Frequent urination suggests impaired glucose control.",
        "Fatigue and mild dehydration also support the hypothesis."
      ]
    },
    {
      "condition": "Cardiovascular Risk",
      "confidence": 0.31,
      "explanation": [
        "Mildly elevated BP may contribute, but other markers are absent."
      ]
    }
  ],
  "soap_note": {
    "subjective": "Patient reports fatigue and frequent urination.",
    "objective": "Vitals stable. Signs of mild dehydration.",
    "assessment": "Likely Type 2 diabetes mellitus.",
    "plan": "Recommend fasting glucose test, dietary adjustments, and follow-up."
  },
  "matched_cases": [
    {
      "case_id": "abc123",
      "similarity_score": 0.91,
      "diagnosis": "Diabetes",
      "summary": "Similar symptoms of fatigue and dehydration in a 54M patient."
    }
  ],
  "ai_metadata": {
    "last_model_used": "vertex-genai-v1",
    "last_prompt_type": "structured-risk-soap",
    "completed_agents": ["NER", "RISK", "SOAP", "MATCH"],
    "execution_time_ms": 2634
  },
  "status": "complete",
  "owner_uid": "firebase-auth-uid"
}

================================================================================

📝 Collection: notes
📌 Purpose:
Store saved and generated SOAP notes for auditing or clinical documentation.

🧾 Schema:
jsonc
Copy
Edit
{
  "_id": "uuid",
  "patient_id": "uuid",         // FK to patients._id
  "note_text": "string",        // Full SOAP text
  "generated_by_ai": true,
  "last_edited": "ISODate",
  "finalized": false
}

=============================================================

🧬 Collection: vectors
📌 Purpose:
Store embedding vectors for ANN-based case matching.

🧾 Schema:
json
Copy
Edit
{
  "_id": "uuid",
  "patient_id": "uuid",
  "embedding": [float],          // e.g. [0.123, 0.456, 0.789, ...]
  "meta": {
    "age": "number",
    "conditions": ["string"],
    "symptoms": ["string"]
  },
  "createdAt": "ISODate"
}
NOTE: Embedding field should be vector-indexed using Atlas's preview feature (bio_similarity index with cosine distance).


## Architectural Violation Report

**File:** `src/components/new-case/NewCaseForm.tsx`

**Function:** `onSubmit`

**Violation:** The `onSubmit` function was making a direct HTTP POST request to `/api/patients` to create a new patient. This violates the core architectural mandate that all CRUD operations must be routed through the Electron IPC layer.

## Technical Debt Analysis

The technical debt was identified as a legacy HTTP `fetch` call in the `NewCaseForm.tsx` component. This component was not updated to use the new IPC-first architecture, which was introduced to centralize all database operations. This violation was likely introduced during the initial development of the application and was not addressed during subsequent refactoring efforts.

## Corrective Code Patch for NewCaseForm.tsx

```diff
--- a/src/components/new-case/NewCaseForm.tsx
+++ b/src/components/new-case/NewCaseForm.tsx
@@ -230,24 +230,22 @@
   async function onSubmit(values: NewCaseFormValues) {
     setIsSubmitting(true);
 
     try {
-      const response = await fetch('/api/patients', {
-        method: 'POST',
-        headers: {
-          'Content-Type': 'application/json',
-        },
-        body: JSON.stringify(values),
-      });
-
-      const result = await response.json();
-
-      if (!response.ok) {
-        throw new Error(result.message || 'Failed to submit the new case.');
-      }
+      // DEPRECATED: Direct API calls are forbidden. Use IPC.
+      // const response = await fetch('/api/patients', {
+      //   method: 'POST',
+      //   headers: {
+      //     'Content-Type': 'application/json',
+      //   },
+      //   body: JSON.stringify(values),
+      // });
+      // const result = await response.json();
+      // if (!response.ok) {
+      //   throw new Error(result.message || 'Failed to submit the new case.');
+      // }
+
+      // CORRECTED: Use Electron IPC to create the patient record.
+      const result = await window.electron.ipcRenderer.invoke('db:createPatient', values);
+
+      if (!result || !result.patientId) {
+        throw new Error('Failed to create patient. Invalid response from main process.');
+      }
 
       toast({
         title: '✅ Case Created Successfully',
```

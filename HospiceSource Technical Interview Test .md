# HospiceSource Technical Interview Test

## Test Brief

### Objective:

The test objective is to create a simple restful POST api using Google Cloud functions that receives a fictional list of sales orders and returns order summary data.

### Timing:

The candidate has 5 days to work on the test, completion of the test is not required within this time period, however the candidate is expected to be able to show the work completed in this case.

### Deliverables:

The candidate will deliver the following at the end of the test.

1. The URI for the API created
2. A link to a public repo of the candidate's choosing where the cloud function code is stored
3. A 30 minute web conference with Joe and Gareth to walk them through the code and process used to develop.

### Technology To Use:

[Google Cloud Functions for Firebase](https://firebase.google.com/docs/functions/) was selected for this test for the following reasons:

1.  No candidates had direct experience in this area and it allows us to judge aptitude to learn new tools
2.  The test requirements can be fulfilled using the free plan. The candidate is expected to setup their own plan.
3.  The Cloud functions platform is well documented and allows for flexibility of coding styles.

Other than using this platform, no other technology restrictions are placed on the candidate. The test case was developed to not require Firestore database interaction.

### Technical Requirements:

The API will accept a POST request with a JSON formatted payload containing an array of fictional order information.

Sample Request Payload:

```
attached to email input.json
```

Sample Response Payload:

```
attached to email output.json
```

#### Data Instructions

##### Patient Data

- Each unique patient name is a unique patient
- Generate a unique identifier for each unique patient
  - This cannot use any of a patient's personally identifying information (PII)

##### Order Data

- Each entry in the input `orders` array is a unique order
- Generate a unique identifier for each unique order
- The `patientId` property in the output `deliveries` and `pickups` arrays should match the generated ID of the patient associated with that order in the input

##### Inventory Data

- Each unique `code` in the input is a unique inventory item
- The output `totalQuantity` property in the `inventoryData` object on each inventory item should be the total number of that item needed for all _deliveries_ in the input

#### Scope Items

1.  CORS - API will be tested with Postman so cross origin resource sharing handling can be ignored.
2.  Authentication - API can be called openly without any user authentication or authorization.
3.  At least a rudimentary level of exception handling is expected.

Overacheivers are welcome to add any personal touches once the base requirements are met!

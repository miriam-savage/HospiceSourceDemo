import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as express from 'express';
import * as bodyParser from 'body-parser';

import { PatientService } from './patient.service';
import { OrderService } from './order.service';

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
db.settings({timestampsInSnapshots: true});
// handline dates
// New:
// const timestamp = snapshot.get('created_at');
// const date = timestamp.toDate();

const app = express();
const main = express();

// Initialize services
const patientService = new PatientService(db);
const orderService = new OrderService(db);

main.use('/api/v1', app);
main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: false }));

// webApi is your functions name, and you will pass main as 
// a parameter
export const webApi = functions.https.onRequest(main);

// Infrastructure test
app.get('/hello', (req, res) => {
    return res.status(200).send('Hello world rev11!');
});

// Get a patient
app.get('/patient/name/:name', async function(req, res) {
    const result = await patientService.getPatientByName(req.params.name);
    res.status(result.httpStatus).send(result);
});

// Add a patient
app.post('/patient', async function(req, res) {
    const result = await patientService.addPatient(req.body);
    res.status(result.httpStatus).send(result);
});

// Add an order
app.post('/order', async function(req, res) {
    const result = await orderService.addOrder(req.body);
    res.status(result.httpStatus).send(result);
});

// Import JSON formatted file of orders
// app.post('/order/import', upload.single('file'), async function(req, res) {
//     const result = await orderService.importOrders(req.file);
//     res.status(result.httpStatus).send(result);
// });

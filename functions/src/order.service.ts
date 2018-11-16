import * as admin from 'firebase-admin';

import { Utils } from './common/utils';
import { IOrder, IOrderDocument } from './models/order.model';
import { PatientService } from './patient.service';
import { LineService } from './line.service';
import { ILine } from './models/line.model';


export class OrderService {
    private db: any = null;
    // private mydb = admin.firestore();
    private patientService: PatientService;
    private lineService: LineService;

    constructor(db: any) {
        this.db = db;
        this.patientService = new PatientService(db);
        this.lineService = new LineService(db);
    }

    static sanitizeOrder(json: any): IOrder {
        const order: IOrder = {
            patient: PatientService.sanitizePatient(json.patient),
            type: json.type
        };

        if (json.hasOwnProperty('id')) order.id = json.id;
        if (json.hasOwnProperty('lines')) order.lines = json.lines;

        return order;
    }

    static sanitizeOrderDocument(json: any): IOrderDocument {
        const order: IOrderDocument = {
            patientId: json.patientId,
            type: json.type
        };
    
        if (json.hasOwnProperty('id')) order.id = json.id;

        return order;
    }

    static validOrder(order: IOrder) {
        if(Utils.isEmpty(order)) return false;

        // Verify patient information
        if(!PatientService.validPatient(order.patient)) return false;

        // Verify order type
        if(Utils.isEmpty(order.type)) return false;
        if (order.type !== 'delivery' && order.type !== 'pickup') return false;

        // Verify lines
        if(Utils.isEmptyList(order.lines)) return false;

        return true;
    }

    async addOrder(json: any) {
        const order = OrderService.sanitizeOrder(json);

        if(!OrderService.validOrder(order)) {
            return { isValid: false, message: '(addOrder) Missing order data', httpStatus: 400 }; 
        }

        // Get patientID if exists
        const patientResults = await this.patientService.getPatientByName(order.patient.name);
        if (!patientResults.isValid) return patientResults;
        if (Utils.isEmpty(patientResults.message)) {
            // Add patient
            const patientAddResults = await this.patientService.addPatient(order.patient);
            if (!patientAddResults.isValid) return patientAddResults;
            order.patient = patientAddResults.message;
        }
        else {
            // Patient already existed
            order.patient = patientResults.message[0];
        }

        // Add Order
        const orderDocument: IOrderDocument = { patientId: order.patient.id, type: order.type};
        const orderResults = await this.db.collection('Orders').add(orderDocument)
        .then(ref => {
            orderDocument.id = ref.id;
            console.log('(addOrder) Added order with ID: ', JSON.stringify(orderDocument));
            return { isValid: true, message: orderDocument, httpStatus: 200 }; 
        })
        .catch(err => {
            console.error('(addOrder) ERROR adding order: ' + err);
            return { isValid: false, message: '(addOrder) ERROR adding order', httpStatus: 500 };
        });

        // Add Lines
        let allLinesAdded = true;
        const badLines: ILine[] = new Array();
        for (const line of order.lines) {
            line.orderId = orderDocument.id;
            const curLine = LineService.sanitizeLine(line);
            if(!LineService.validLine(curLine)) {
                allLinesAdded = false;
                badLines.push(curLine);
            }
            else {
                const lineAddResult = await this.lineService.addLine(curLine);
                if (!lineAddResult.isValid) {
                    allLinesAdded = false;
                    badLines.push(curLine);
                }
            }
        }
        
        let results;
        if(allLinesAdded) results = orderResults;
        else results = {isValid: false, message: {message: 'Some lines not added', badLines: badLines}, httpStatus: 400};

        return results; 
    }

    async importOrders (file) {
        console.log('Reading file:\n' + file.buffer.toString());
        return { isValid: true, message: 'Orders imported', httpStatus: 200 };
    }
}
import * as admin from 'firebase-admin';

import { Utils } from './common/utils';
import { IOrder, IOrderDocument } from './models/order.model';
import { PatientService } from './patient.service';
import { LineService } from './line.service';
import { ILine } from './models/line.model';
import { IPatient } from './models/patient.model';


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

    static buildPatientData(patients: IPatient[]) {
        const patientSummary = {
            patientCound: patients.length,
            patients: []
        };

        for (const p of patients) {
            patientSummary.patients.push({id: p.id, name: p.name});
        }

        return patientSummary;

    }

    static bulidOrderData (orders: IOrderDocument[], lines: ILine[], patients: IPatient[]) {
        const orderDatas: any[] = new Array();
        for (const order of orders) {
            const curPatient = patients.find(p => p.id === order.patientId);
            let address;
            if (!Utils.isEmpty(curPatient)) {
                address = curPatient.address;
                if (!Utils.isEmpty(curPatient.address2)) address = address + ' ' + curPatient.address2;
                address = address + ', ' + curPatient.city + ', ' + curPatient.state + ' ' + curPatient.zip
            }
            else {
                address = 'ERROR GETTING ADDRESS';
            }

            const oData = {
                id: order.id,
                patientId: order.patientId,
                address: address,
                lines: []
            }
            
            for (const line of lines) {
                if (line.orderId === order.id) {
                    oData.lines.push({code: line.code, description: line.description, quantity: line.quantity});
                }
            }
            orderDatas.push(oData);
        }

        return orderDatas;
    }

    static buildInventoryData(orderIds: string[], lines: ILine[]) {
        const inventories: any[] = new Array();
        for (const line of lines) {
            // Check if line item is part of the (delivery) order list
            if (orderIds.indexOf(line.orderId) >= 0) {
                const offset = inventories.findIndex(item => item.code === line.code);
                if (offset < 0) {
                    inventories.push({code: line.code, description: line.description, quantity: line.quantity});
                }
                else {
                    inventories[offset].quantity += line.quantity;
                }
            }
        }
        return Utils.sortByString(inventories, 'code', true);
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
        else results = {isValid: false, message: {message: '(addOrder) Some lines not added', badLines: badLines}, httpStatus: 400};

        return results; 
    }

    async addOrdersMultiple(json: any) {
        if (Utils.isEmpty(json) || !json.hasOwnProperty('orders') || Utils.isEmptyList(json.orders)) {
            return { isValid: false, message: '(addOrdersMultiple) Missing order data', httpStatus: 400 }; 
        }

        const failedOrders: any[] = new Array();

        for (const order of json.orders) {
            const result = await this.addOrder(order);
            if (!result.isValid) failedOrders.push(result.message);
        }

        if (Utils.isEmptyList (failedOrders)) {
            const orderSumResult = await this.getOrderSummary();
            return orderSumResult.message;
        }
        else {
            return {isValid: false, message: { message: 'Some orders were not successfully added', successfullyAdded: json.orders - failedOrders.length, failedOrders: failedOrders }, httpStatus: 200};
        }
    }

    async importOrders (file) {
        console.log('Reading file:\n' + file.buffer.toString());
        return { isValid: true, message: 'Orders imported', httpStatus: 200 };
    }

    async getOrderSummary() {
        const orderSummary = { isValid: true, message: {}, httpStatus: 200 };
        // Get all orders
        //Use name key to find matching patients
        const ordersRef = this.db.collection('Orders');
        const orderResults = await ordersRef.get()
        .then(snapshot => {
            const oDocs: IOrderDocument[] = new Array();
            snapshot.forEach(doc => {
                const tempOrder: IOrderDocument = doc.data();
                tempOrder.id = doc.id;
                oDocs.push(OrderService.sanitizeOrderDocument(tempOrder));
            });
            return { isValid: true, message: oDocs, httpStatus: 200 };
        })
        .catch(err => {
            console.error('Error getting orders ' + err);
            return { isValid: false, message: 'ERROR getting order', httpStatus: 500 };
        });
        if (!orderResults.isValid) return orderResults;

        // Get all patients
        const patientsRef = this.db.collection('Patients');
        const patientResults = await patientsRef.get()
        .then(snapshot => {
            const pDocs: IPatient[] = new Array();
            snapshot.forEach(doc => {
                const tempPatient: IOrderDocument = doc.data();
                tempPatient.id = doc.id;
                pDocs.push(PatientService.sanitizePatient(tempPatient));
            });
            return { isValid: true, message: pDocs, httpStatus: 200 };
        })
        .catch(err => {
            console.error('Error getting patients ' + err);
            return { isValid: false, message: 'ERROR getting patient', httpStatus: 500 };
        });
        if (!patientResults.isValid) return patientResults;

        // Get all lines
        const linesRef = this.db.collection('Lines');
        const lineResults = await linesRef.get()
        .then(snapshot => {
            const lDocs: ILine[] = new Array();
            snapshot.forEach(doc => {
                const tempLine: ILine = doc.data();
                tempLine.id = doc.id;
                lDocs.push(LineService.sanitizeLine(tempLine));
            });
            return { isValid: true, message: lDocs, httpStatus: 200 };
        })
        .catch(err => {
            console.error('Error getting lines ' + err);
            return { isValid: false, message: 'ERROR getting lines', httpStatus: 500 };
        });
        if (!lineResults.isValid) return lineResults;

        // Get data lists
        const orderDocuments: IOrderDocument[] = orderResults.message;
        const lines: ILine[] = lineResults.message;
        const patientIds: any[] = orderDocuments.map(oDoc => oDoc.patientId);
        const patients: IPatient[] = patientResults.message.filter(item => patientIds.indexOf(item.id) >= 0);

        // Build data sets
        const patientSummary = OrderService.buildPatientData(patients);
        const deliveryData = OrderService.bulidOrderData(orderDocuments.filter(o => o.type === 'delivery'), lines, patients);
        const pickupData = OrderService.bulidOrderData(orderDocuments.filter(o => o.type === 'pickup'), lines, patients);
        const inventoryData = OrderService.buildInventoryData(orderDocuments.filter(o => o.type === 'delivery').map(item => item.id), lines);

        orderSummary.message = {
            patientData: patientSummary,
            orderData: {
                deliveryData: {
                    deliveryCount: deliveryData.length,
                    deliveries: deliveryData
                },
                pickupData: {
                    pickupCount: pickupData.length,
                    pickups: pickupData
                }
            },
            inventoryData: {
                inventory: inventoryData
            }
        };
        return orderSummary;

    }
}
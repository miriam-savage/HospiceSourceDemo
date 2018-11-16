import * as admin from 'firebase-admin';
import { Utils } from './common/utils';
import { ILine } from './models/line.model';

export class LineService {
    private db: any = null;
    // private mydb = admin.firestore();

    constructor(db: any) {
        this.db = db;
    }

    static sanitizeLine(json: any): ILine {
        const line: ILine = {
            code: json.code,
            description: json.description,
            quantity: json.hasOwnProperty('quantity') ? json.quantity : 0,
            orderId: json.orderId
        };
    
        if (json.hasOwnProperty('id')) line.id = json.id;

        return line;
    }

    static validLine(line: ILine) {
        if(Utils.isEmpty(line)) return false;
        if(Utils.isEmpty(line.code)) return false;
        if(Utils.isEmpty(line.description)) return false;
        if(Utils.isEmpty(line.quantity) || line.quantity <= 0) return false;
        if(Utils.isEmpty(line.orderId)) return false;
        return true;
    }

    async addLine(json: any) {
        const line = LineService.sanitizeLine(json);

        if (!LineService.validLine(line)) {
            return { isValid: false, message: '(addLine) Missing or invalid line data', httpStatus: 400 };
        }

        // Add line
        const results = await this.db.collection('Lines').add(line)
        .then(ref => {
            line.id = ref.id;
            console.log('(addLine) Added line with ID: ', line.id);
            return { isValid: true, message: line, httpStatus: 200 }; 
        })
        .catch(err => {
            console.error('(addLine) Error adding line: ' + err);
            return { isValid: false, message: '(addLine) ERROR adding line: ' + line.code, httpStatus: 500 };
        });

        return results;
    }

    async getLineByOrderId(orderId: string) {
        if(Utils.isEmpty(orderId)) {
            return { isValid: false, message: '(getLineByOrderId) Missing search parameter', httpStatus: 400 };
        }

        //Use orderId to find line items
        const linesRef = this.db.collection('Lines');
        const results = await linesRef.where('orderId', '==', orderId).get()
        .then(snapshot => {
            const foundLines: ILine[] = new Array();
            snapshot.forEach(doc => {
                foundLines.push(LineService.sanitizeLine(doc.data()));
            });
            return { isValid: true, message: foundLines, httpStatus: 200 };
        })
        .catch(err => {
            console.error('(getLineByOrderId) Error getting line for order ' + orderId + ': ' + err);
            return { isValid: false, message: '(getLineByOrderId) ERROR getting line', httpStatus: 500 };
        });

        return results;
    }

}